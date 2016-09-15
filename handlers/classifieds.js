const logger = require('../lib/logger.js');

exports.index = {
  method: 'post',
  path: '/',
  description: 'index a new classified',
  schema: {
    type: 'object',
    properties: {
      id: {type: ['integer', 'string']},
      title: {type: 'string'},
      content: {type: 'string'},
      createdAt: {type: 'string'},
      updatedAt: {type: 'string'},
      price: {type: ['number', 'string']},
      tags: {
        type: 'array',
        items: {type: 'string'}
      },
      author: {
        type: 'object',
        properties: {
          email: {type: 'string', format: 'uuid'}
        }
      }
    },
    required: ['id', 'title', 'content']
  },
  handler: [function * (next) {
    const {token} = this.state;
    const {scope} = token;
    if (scope.type !== 'app') {
      return this.throw(403, {error_description: 'You don\'t have the required permission'});
    }
    yield *next;
  }, function * (next) {
    const {es} = this.app.context;
    const timestamp = Date.now();
    const indexData = {
      index: 'classifieds',
      body: this.request.body,
      version: timestamp,
      type: 'classified',
      versionType: 'external'
    };
    const {_id, created} = yield es.create(indexData);
    this.body = {_id, created};
    this.status = 201;
  }]
};

exports.search = {
  method: 'post',
  path: '/search',
  schema: {
    type: 'object',
    properties: {
      query: {type: 'string'},
      offset: {type: ['number', 'string']},
      size: {type: ['number', 'string']},
    }
  },
  description: 'search through classifieds',
  handler: function * (next) {
    const {es} = this.app.context;
    const {query, from = 0, size = 20} = this.request.body;
    const {scope} = this.state.token;

    const {hits} = yield es.search({
      q: query || '',
      index: 'classifieds',
      type: 'classified',
      from,
      size
    });

    this.body = {
      count: hits.total,
      documents: hits.hits.map(h=> {
        return {
          _id: h._id,
          relevance: h._score,
          document: h._source
        }
      })
    };

    es.create({
      index: 'searches',
      type: 'search',
      body: Object.assign({}, this.request.body, {author: scope})
    })
      .catch(function (e) {
        logger.error(e);
      });
  }
};