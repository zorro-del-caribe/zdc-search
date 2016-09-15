module.exports = function () {
  return function * (next) {
    const {token} = this.state;
    const {conf, zdc} = this.app.context;

    const fullToken = yield zdc.tokens(conf.value('auth')).self({token});
    const {revoked, expires_in, scope} = fullToken;

    if (revoked || expires_in <= 0 || ['user', 'app'].indexOf(scope.type) === -1) {
      this.throw(403, 'The token is invalid, revoked or expired');
    }

    this.state.token = fullToken;

    yield *next;
  };
};