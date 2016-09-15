exports.default = {
  hostname: process.env.ES_HOST || 'es',
  port:process.env.ES_PORT || 9200
};

exports.staging = {};

exports.production = {};