const elasticsearch = require('elasticsearch');
const url = require('url');

function findOrCreateIndex (client, indexName) {
  return client.indices.exists({index: indexName})
    .then(function (result) {
      return result ? client.indices.get({index: indexName})
        : client.indices.create({index: indexName});
    });
}

module.exports = {
  priority: 200,
  init: function (app, handlers, startOptions = {}) {
    const {conf} = app.context;
    const esConf = conf.value('elasticsearch');
    const host = url.format(esConf);

    return new Promise(function (resolve, reject) {
      function tryConnection (client, retry, timeout = 4000) {
        setTimeout(function () {
          return client.ping()
            .catch(e=> {
              if (retry > 0) {
                console.log(`trying connect: ${retry} times left`);
                tryConnection(client, --retry);
              } else {
                throw e;
              }
            })
            .then(function () {
              if (startOptions.es && startOptions.es.reset) {
                return client.indices.delete({index: ['classifieds', 'searches']});
              }
            })
            .then(function () {
              return Promise.all([
                findOrCreateIndex(client, 'classifieds'),
                findOrCreateIndex(client, 'searches')
              ]);
            })
            .then(function () {
              app.context.es = client;
              resolve(app);
            });
        }, timeout);
      }

      const client = new elasticsearch.Client({
        host
      });

      tryConnection(client, 5, 200);
    });
  }
};