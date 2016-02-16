'use strict';

var LoggerFactory = require('util/log').LoggerFactory;

var uuid = require('uuid');

function ContextConfiguration(loggingConfig) {
  this.loggerFactory = new LoggerFactory(loggingConfig);
}
ContextConfiguration.prototype.constructor = ContextConfiguration;

ContextConfiguration.prototype._addLogger = function(context) {
  var fields = {
    requestId: uuid.v4()
  };

  context.logger = this.loggerFactory.getLogger(fields);
};

ContextConfiguration.prototype.getContext = function() {
  var context = {};

  this._addLogger(context);

  return context;
};

module.exports = new ContextConfiguration({
    type: 'FileStream',
    config: {
      name: 'unit',
      path: 'logs/unit.log',
      level: 'debug'
    }
  });
