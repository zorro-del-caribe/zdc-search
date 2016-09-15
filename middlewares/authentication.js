module.exports = function () {
  return function * (next) {
    const auth = this.get('Authorization');
    if (!auth) {
      this.throw(401, {error_description: 'missing or invalid authorization header'});
    }

    const [tokenType, token] = auth.split(' ');

    if (!tokenType || !token || tokenType !== 'Bearer') {
      this.throw(401, {error_description: 'authentication scheme requires Bearer token'});
    }

    this.state.token = token;
    yield next;
  };
};