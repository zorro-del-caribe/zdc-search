const auth = require('zdc-auth');

module.exports = {
  priority: 300,
  init(app){
    const {conf} = app.context;
    const {client_id, secret, fqdn:endpoint} = conf.value('auth');
    app.context.auth = auth({
      client_id,
      secret,
      endpoint
    });
    return app;
  }
};