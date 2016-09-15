const zdc = require('zdc');

module.exports = {
  priority: 300,
  init(app){
    app.context.zdc = zdc();
    return app;
  }
};