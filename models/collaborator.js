var request = require('request');
var Promise = require('promise');
var _ = require('lodash');
var fmt = require('util').format;
var decorate = require(__dirname + '/../presenters/collaborator');

var Collaborator = module.exports = function(opts) {
  _.extend(this, {
    host: process.env.USER_API || "https://user-api-example.com",
    bearer: false
  }, opts);

  return this;
};

Collaborator.new = function(request) {
  var bearer = request.auth.credentials && request.auth.credentials.name
  return new Collaborator({bearer: bearer})
}

Collaborator.prototype.list = function(package, callback) {
  var _this = this;
  var url = fmt("%s/package/%s/collaborators", this.host, package);
  return new Promise(function(resolve, reject) {
    request.get({
        url: url,
        json: true,
        headers: {
          bearer: _this.bearer
        }
      },
      function(err, resp, body) {
        if (err) {
          return reject(err);
        }
        if (resp.statusCode > 399) {
          err = Error('error getting collaborators for package: ' + package);
          err.statusCode = resp.statusCode;
          return reject(err);
        }

        Object.keys(body).forEach(function(username){
          body[username] = decorate(body[username])
        })

        return resolve(body);
      });
  }).nodeify(callback);
};

Collaborator.prototype.add = function(package, collaborator, callback) {
  var _this = this;
  var url = fmt("%s/package/%s/collaborators", this.host, package);

  return new Promise(function(resolve, reject) {
    request.put({
      url: url,
      json: true,
      headers: {
        bearer: _this.bearer
      },
      body: collaborator
    }, function(err, resp, body) {
      if (err) {
        return reject(err);
      }
      if (resp.statusCode > 399) {
        err = Error('error adding collaborator to package: ' + package);
        err.statusCode = resp.statusCode;
        return reject(err);
      }
      return resolve(decorate(body));
    });
  }).nodeify(callback);};


Collaborator.prototype.update = function(package, collaborator, callback) {
  var _this = this;
  var url = fmt("%s/package/%s/collaborators/%s", this.host, package, collaborator.name);

  return new Promise(function(resolve, reject) {
    request.post({
      url: url,
      json: true,
      headers: {
        bearer: _this.bearer
      },
      body: collaborator
    }, function(err, resp, body) {
      if (err) {
        return reject(err);
      }
      if (resp.statusCode > 399) {
        err = Error('error updating collaborator access to package: ' + package);
        err.statusCode = resp.statusCode;
        return reject(err);
      }
      return resolve(decorate(body));
    });
  }).nodeify(callback);};


Collaborator.prototype.del = function(package, collaboratorName, callback) {
  var _this = this;
  var url = fmt("%s/package/%s/collaborators/%s", this.host, package, collaboratorName);

  return new Promise(function (resolve, reject) {
    request.del({url: url, json: true, headers: {bearer: _this.bearer}}, function(err, resp, body){
      if (err) { return reject(err); }
      if (resp.statusCode > 399) {
        err = Error('error removing collaborator from package: ' + package);
        err.statusCode = resp.statusCode;
        return reject(err);
      }
      return resolve(decorate(body));
    });
  }).nodeify(callback);
};
