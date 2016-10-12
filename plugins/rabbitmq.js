const url = require('url');
const amqp = require('amqplib');

module.exports = {
  priority: 300,
  init(app, handlers){
    if (process.env.NODE_ENV !== 'test') {
      const {conf} = app.context;
      const rabbit = conf.value('broker');
      const urlString = url.format(rabbit);

      return new Promise(function (resolve, reject) {
        function tryConnection (retry, timeout = 5000) {
          setTimeout(function () {
            amqp.connect(urlString)
              .then(conn=> {
                return conn.createChannel();
              })
              .then(function (ch) {
                ch.assertExchange('zdc', 'topic', {durable: false});
                app.context.channel = ch;

                return ch.assertQueue('', {exclusive: true})
                  .then(function (q) {
                    ch.bindQueue(q.queue, 'zdc', 'zdc.classifieds.*');
                    ch.consume(q.queue, function (msg) {
                      const {fields, content,} = msg;
                      const {routingKey} = fields;
                      const [action,...rest] = routingKey.split('.').reverse();

                      if (action === 'create') {
                        app.context.jobs().index(JSON.parse(content.toString()))
                          .catch(function (err) {
                            console.log('could not create job');
                            console.error(err);
                          });
                      }
                    });
                  });
              })
              .then(function () {
                resolve(app);
              })
              .catch(err=> {
                if (retry > 0) {
                  console.log(`trying connect to broker: ${retry} times left`);
                  tryConnection(--retry);
                } else {
                  reject(err);
                }
              });
          }, timeout);
        }

        tryConnection(5);
      });
    }
  }
};