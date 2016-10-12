const auth = require('zdc-auth');
const noauth = require('zdc-client').noauth;
module.exports = {
  priority: 250,
  init(app){
    const {conf} = app.context;
    const {client_id, secret, fqdn:endpoint} = conf.value('auth');

    app.context.auth = auth({
      client_id,
      secret,
      endpoint
    });

    app.context.jobs = noauth({
      schema: {
        index: {
          path: '/classifieds/index',
          method: 'post',
          body: ['id', 'title', 'content', 'tags', 'price', 'createdAt', 'updatedAt']
        }
      }, namespace: 'jobs',
      endpoint: conf.value('jobs')
    });

    if (process.env.NODE_ENV !== 'test') {
      return app.context.auth
        .tokens()
        .create({grant_type: 'client_credentials'})
    }
  }
};