const logMiddleware = require('../middlewares/logger');
const logger = require('../lib/logger');
const bodyParser = require('koa-bodyparser');
const gzip = require('koa-compress');
const auth = require('../middlewares/authentication');
const auz = require('../middlewares/authorization');

module.exports = {
  priority: 200,
  init: function (app, handlers) {
    return app
      .use(gzip())
      .use(logMiddleware({logger}))
      .use(bodyParser())
      .use(auth())
      .use(auz());
  }
};