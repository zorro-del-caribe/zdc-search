const logger = require('./lib/logger.js');
const app = require('./app.js')();
app.start()
  .catch(function (err) {
    logger.error(err);
    process.exit(1);
  });