const test = require('tape');
const req = require('supertest');
const koa = require('koa');
const authentication = require('../../middlewares/authentication');
const authorization = require('../../middlewares/authorization');
const http = require('http');

function mockAuth (response) {
  return {
    tokens(params = {}){
      return {
        self(selfOpts = {}){
          const {token} = selfOpts;
          if (token !== 'foo')
            return Promise.reject('invalid token value');

          return Promise.resolve(response);
        }
      }
    }
  }
}

function mockConf () {
  return {
    value(path){
      if (path !== 'auth')
        throw new Error('wrong conf path');

      return {}
    }
  }
}

test('authentication middleware: http 401 if there is no Authorization header', t=> {
  const app = koa()
    .use(authentication());

  req(http.createServer(app.callback()))
    .get('/')
    .expect(401)
    .end(function (err, {body}) {
      t.error(err);
      t.end();
    });
});

test('authentication middleware: http 401 if authorisation hedare is invalid', t=> {
  const app = koa()
    .use(authentication());

  req(http.createServer(app.callback()))
    .get('/')
    .set('Authorization', 'Basic alkdjsfsf=')
    .expect(401)
    .end(function (err, {body}) {
      t.error(err);
      t.end();
    });
});

test('authentication middleware: assign token to request state ', t=> {
  const app = koa()
    .use(authentication())
    .use(function * () {
      this.body = this.state;
    });

  req(http.createServer(app.callback()))
    .get('/')
    .set('Authorization', 'Bearer foo')
    .expect(200)
    .end(function (err, {body}) {
      t.error(err);
      t.equal(body.token, 'foo');
      t.end();
    });
});

test('authorization middleware: http 403 if token has been revoked', t=> {
  const app = koa()
    .use(function * (next) {
      this.state.token = 'foo';
      yield *next;
    })
    .use(authorization());

  app.context.auth = mockAuth({
    token: 'foo',
    revoked: true,
    scope: {},
    expires_in: 234
  });
  app.context.conf = mockConf();

  req(http.createServer(app.callback()))
    .get('/')
    .expect(403)
    .end(function (err, {body}) {
      t.error(err);
      t.end();
    });
});

test('authorization middleware: http 403 if token has been revoked', t=> {
  const app = koa()
    .use(function * (next) {
      this.state.token = 'foo';
      yield *next;
    })
    .use(authorization());

  app.context.auth = mockAuth({
    token: 'foo',
    revoked: false,
    scope: {},
    expires_in: -12
  });
  app.context.conf = mockConf();

  req(http.createServer(app.callback()))
    .get('/')
    .expect(403)
    .end(function (err, {body}) {
      t.error(err);
      t.end();
    });
});

test('authorization middleware: assign token result', t=> {
  const app = koa()
    .use(function * (next) {
      this.state.token = 'foo';
      yield *next;
    })
    .use(authorization())
    .use(function * () {
      this.body = this.state.token;
    });

  app.context.auth = mockAuth({
    token: 'foo',
    revoked: false,
    scope: {
      type: 'user'
    },
    expires_in: 234
  });
  app.context.conf = mockConf();

  req(http.createServer(app.callback()))
    .get('/')
    .expect(200)
    .end(function (err, {body}) {
      t.error(err);
      t.deepEqual(body, {
        token: 'foo',
        revoked: false,
        scope: {
          type: 'user'
        },
        expires_in: 234
      });
      t.end();
    });
});