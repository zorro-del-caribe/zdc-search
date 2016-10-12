const url = require('url');
const amqp = require('amqplib');
const broker = require('../middlewares/broker');
module.exports = {
  priority: 202,
  init(app, handlers){
    if (process.env.NODE_ENV !== 'test') {
      const {conf} = app.context;
      const rabbit = conf.value('broker');
      const urlString = url.format(rabbit);
      const verbose = handlers.filter(h=>h.notify === true);

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
                for (const h of verbose) {
                  const handlers = Array.isArray(h.handler) ? h.handler : [h.handler];
                  handlers.unshift(broker(['zdc', h.namespace, h.title].join('.')));
                  h.handler = handlers;
                }
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