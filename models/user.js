var request = require('request');
var Promise = require('promise');
var _ = require('lodash');
var fmt = require('util').format;
var userValidate = require('npm-user-validate');
var mailchimp = require('mailchimp-api');
var decorate = require(__dirname + '/../presenters/user');

var User = module.exports = function(opts) {
  _.extend(this, {
    host: process.env.USER_API || "https://user-api-example.com",
    bearer: false
  }, opts);

  if (!this.logger) {
    this.logger = {
      error: console.error,
      info: console.log
    };
  }

  return this;
};

User.new = function(request) {
  var bearer = request.auth.credentials && request.auth.credentials.name;
  return new User({bearer: bearer, logger: request.logger});
};

User.prototype.confirmEmail = function (user, callback) {
  var url = fmt("%s/user/%s/verify", this.host, user.name);
  this.log(url);

  return new Promise(function(resolve, reject) {
    var opts = {
      method: "POST",
      url: url,
      json: true,
      body: {
        verification_key: user.verification_key
      }
    };

    request(opts, function (err, resp, body) {
      if (err) { return reject(err); }
      if (resp.statusCode > 399) {
        err = Error('error verifying user ' + user.name);
        err.statusCode = resp.statusCode;
        return reject(err);
      }
      return resolve(body);
    });
  }).nodeify(callback);
};

User.prototype.login = function(loginInfo, callback) {
  var url = fmt("%s/user/%s/login", this.host, loginInfo.name);

  return new Promise(function (resolve, reject) {
    request({
      method: "POST",
      url: url,
      json: true,
      body: {
        password: loginInfo.password
      }
    }, function (err, resp, body) {

      if (err) { return reject(err); }

      if (resp.statusCode === 401) {
        err = Error('password is incorrect for ' + loginInfo.name);
        err.statusCode = resp.statusCode;
        return reject(err);
      }

      if (resp.statusCode === 404) {
        err = Error('user ' + loginInfo.name + ' not found');
        err.statusCode = resp.statusCode;
        return reject(err);
      }

      return resolve(body);
    });
  }).nodeify(callback);
};

User.prototype.get = function(name, options, callback) {
  var _this = this;
  var user;
  var url = fmt("%s/user/%s", this.host, name);

  if (!callback) {
    callback = options;
    options = {};
  }

  return new Promise(function(resolve, reject) {
    request({
      method: "GET",
      url: url,
      json: true
    }, function(err, resp, body) {
      if (err) {
        return reject(err);
      }
      if (resp.statusCode > 399) {
        err = Error('error getting user ' + name);
        err.statusCode = resp.statusCode;
        return reject(err);
      }
      return resolve(body);
    });
  })
  .then(function(_user){
    user = decorate(_user);

    return options.stars ? _this.getStars(user.name) : null;
  })
  .then(function(_stars){
    if (_stars) { user.stars = _stars; }
    return options.packages ? _this.getPackages(user.name) : null;
  })
  .then(function(_packages){
    if (_packages) { user.packages = _packages; }
    return user;
  })
  .nodeify(callback);
};

User.prototype.getPackages = function(name, callback) {
  var _this = this;
  var url = fmt("%s/user/%s/package", this.host, name);

  return new Promise(function(resolve, reject) {
    var opts = {
      method: "GET",
      url: url,
      qs: {
        per_page: 9999
      },
      json: true,
      headers: {bearer: _this.bearer}
    };

    request(opts, function(err, resp, body){

      if (err) { return reject(err); }
      if (resp.statusCode > 399) {
        err = Error('error getting packages for user ' + name);
        err.statusCode = resp.statusCode;
        return reject(err);
      }
      return resolve(body);
    });
  }).nodeify(callback);
};

User.prototype.getStars = function(name, callback) {
  var _this = this;
  var url = fmt("%s/user/%s/stars", this.host, name);

  return new Promise(function(resolve, reject) {
    var opts = {
      method: "GET",
      url: url,
      json: true,
      headers: {bearer: _this.bearer}
    };

    request(opts, function(err, resp, body){

      if (err) { return reject(err); }
      if (resp.statusCode > 399) {
        err = Error('error getting stars for user ' + name);
        err.statusCode = resp.statusCode;
        return reject(err);
      }
      return resolve(body);
    });
  })
  .nodeify(callback);
};

User.prototype.log = function(msg) {
  if (this.debug) { this.logger.info(msg); }
};

User.prototype.login = function(loginInfo, callback) {
  var url = fmt("%s/user/%s/login", this.host, loginInfo.name);
  this.log(url);

  return new Promise(function (resolve, reject) {

    request({
      method: "POST",
      url: url,
      json: true,
      body: {
        password: loginInfo.password
      }
    }, function (err, resp, body) {

      if (err) { return reject(err); }

      if (resp.statusCode === 401) {
        err = Error('password is incorrect for ' + loginInfo.name);
        err.statusCode = resp.statusCode;
        return reject(err);
      }

      if (resp.statusCode === 404) {
        err = Error('user ' + loginInfo.name + ' not found');
        err.statusCode = resp.statusCode;
        return reject(err);
      }

      return resolve(body);
    });
  }).nodeify(callback);
};

User.prototype.lookupEmail = function(email, callback) {
  var _this = this;

  return new Promise(function (resolve, reject) {
    if(userValidate.email(email)) {
      var err = new Error('email is invalid');
      err.statusCode = 400;
      _this.log(err);
      return reject(err);
    }

    var url = _this.host + "/user/" + email;
    _this.log(url);

    request({method: "GET", url: url, json: true}, function (err, resp, body) {
      if (err) { return reject(err); }
      if (resp.statusCode > 399) {
        err = Error('error looking up username(s) for ' + email);
        err.statusCode = resp.statusCode;
        return reject(err);
      }

      return resolve(body);
    });
  }).nodeify(callback);
};

User.prototype.save = function (user, callback) {
  var url = this.host + "/user/" + user.name;

  return new Promise(function (resolve, reject) {
    var opts = {
      method: "POST",
      url: url,
      json: true,
      body: user
    };

    request(opts, function (err, resp, body) {
      if (err) { return reject(err); }
      if (resp.statusCode > 399) {
        err = Error('error updating profile for ' + user.name);
        err.statusCode = resp.statusCode;
        return reject(err);
      }
      return resolve(body);
    });
  }).nodeify(callback);
};

User.prototype.signup = function (user, callback) {
  var _this = this;

  if (user.npmweekly === "on") {
    var mc = this.getMailchimp();
    mc.lists.subscribe({id: 'e17fe5d778', email:{email:user.email}}, function(data) {
      // do nothing on success
    }, function(error) {
      _this.logger.error('Could not register user for npm Weekly: ' + user.email);
      if (error.error) {
        _this.logger.error(error.error);
      }
    });
  }

  var url = this.host + "/user";

  return new Promise(function (resolve, reject) {
    var opts = {
      method: "PUT",
      url: url,
      body: user,
      json: true
    };

    request(opts, function (err, resp, body) {
      if (err) { return reject(err); }
      if (resp.statusCode > 399) {
        err = Error('error creating user ' + user.name);
        err.statusCode = resp.statusCode;
        return reject(err);
      }
      return resolve(body);
    });
  })
  .nodeify(callback);
};

User.prototype.getMailchimp = function getMailchimp () {
  return new mailchimp.Mailchimp(process.env.MAILCHIMP_KEY);
};

User.prototype.verifyPassword = function (name, password, callback) {
  var loginInfo = {
    name: name,
    password: password
  };

  return this.login(loginInfo, callback);
};
