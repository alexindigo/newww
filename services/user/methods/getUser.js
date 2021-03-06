var Boom = require('boom'),
    Hapi = require('hapi'),
    anonCouch = require('../../../adapters/couchDB').anonCouch,
    metrics = require('../../../adapters/metrics')();

module.exports = function getUser (name, next) {

  var start = Date.now();

  anonCouch.get('/_users/org.couchdb.user:' + name, function (er, cr, data) {
    metrics.metric({
      name:   'latency',
      value:  Date.now() - start,
      type:   'couchdb',
      browse: 'user ' + name
    });

    if (er || cr && cr.statusCode !== 200 || !data || data.error) {
      return next(Boom.notFound('Username not found: ' + name));
    }

    return next(null, data);
  })
}
