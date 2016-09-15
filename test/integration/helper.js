const app = require('../../app');
const req = require('supertest');
const nock = require('nock');
const url = require('url');

module.exports = {
  testFor(tokenScope = {type: 'user', target: 'hello@world.com'}){
    const a = app();
    return a.start({es:{reset:true}})
      .then(function () {
        const {conf} = a.context;
        const {client_id:user, secret:pass}=conf.value('auth');
        const auth = nock(url.format(conf.value('auth.endpoint')))
          .get('/tokens/tokenCode')
          .basicAuth({user, pass})
          .reply(200, {
            revoked: false,
            expires_in: 2000,
            access_token: 'access',
            scope: tokenScope
          });

        return {req: req(a.server), app: a};
      })
      .catch(err=> {
        console.error(err);
        t.end(err);
      });

  }
};