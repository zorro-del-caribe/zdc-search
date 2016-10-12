exports.default = {
  hostname: process.env.RABBITMQ_HOST || 'broker',
  port: process.env.RABBITMQ_PORT || 5672,
  protocol: 'amqp',
  slashes: true
};