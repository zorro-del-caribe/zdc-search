const test = require('tape');
const helper = require('./helper');
const testFor = helper.testFor;
const casual = require('casual');

test('index a new classified', t=> {

  testFor({type: 'app'})
    .then(function ({req, app}) {
      req
        .post('/classifieds')
        .set('Authorization', 'Bearer tokenCode')
        .send({title: 'new post', id: '2342', content: 'that is a content', price: 54.32, tags: ['foo', 'bar']})
        .expect(201)
        .end(function (err, {body}) {
          t.error(err);
          t.ok(body._id);
          t.equal(body.created, true);
          app.stop();
          t.end();
        });
    })
    .catch(t.end);
});

test('index a new classified fails with 403 as the token does not bear app permission', t=> {
  testFor()
    .then(function ({req, app}) {
      req
        .post('/classifieds')
        .set('Authorization', 'Bearer tokenCode')
        .send({title: 'new post', id: '2342', content: 'that is a content', price: 54.32, tags: ['foo', 'bar']})
        .expect(403)
        .end(function (err, {body}) {
          t.error(err);
          t.equal(body.error_description, 'You don\'t have the required permission');
          app.stop();
          t.end();
        });
    })
    .catch(t.end);
});

test('search in the name of a user', t=> {
  testFor({type: 'user', target: 'blah@what.com'})
    .then(function ({req, app}) {

      const {es} = app.context;
      const bulk = [];

      for (const id of [1, 2, 3, 4, 5, 6, 7, 8, 9, 10]) {
        bulk.push({index: {_index: 'classifieds', _type: 'classified'}});
        bulk.push({title: casual.title, content: casual.sentence, id, tags: ['foo']});
      }

      es.bulk({
        body: bulk
      })
        .then(function () {
          // let the time to index
          setTimeout(function () {
            req
              .post('/classifieds/search')
              .set('Authorization', 'Bearer tokenCode')
              .send({query: 'foo', size: 5, consistency: 'all'})
              .expect(200)
              .end(function (err, {body}) {
                t.error(err);
                t.equal(body.count, 10);
                t.equal(body.documents.length, 5);
              });
          }, 1000);

          setTimeout(function () {
            es.search({
              index: 'searches',
              q: 'author.target:blah@what.com',
              searchType: 'count'
            })
              .then(function (result) {
                t.equal(result.hits.total, 1);
                app.stop();
                t.end();
              });
          }, 2000);
        });
    })
    .catch(t.end);
});