'use strict';

var deepcopy = require('deepcopy'),
    uuid = require('uuid');

var LoggerFactory = require('util/log').LoggerFactory;

function ContextConfiguration(config) {
  this.config = config;
  this.loggerFactory = new LoggerFactory(config.logging);
}
ContextConfiguration.prototype.constructor = ContextConfiguration;

ContextConfiguration.prototype._addLogger = function(context) {
  var fields = {
    requestId: uuid.v4()
  };

  context.logger = this.loggerFactory.getLogger(fields);
};

ContextConfiguration.prototype.getContext = function() {
  var context = {
    aws: deepcopy(this.config.aws)
  };

  this._addLogger(context);

  return context;
};

module.exports = new ContextConfiguration({
  aws: {
    region: 'us-east-1'
  },
  logging: {
    type: 'FileStream',
    config: {
      name: 'lambda',
      path: 'logs/lambda.log',
      level: 'debug'
    }
  }
});
