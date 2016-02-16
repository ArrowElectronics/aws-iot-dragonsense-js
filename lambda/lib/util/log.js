'use strict';

var bunyan = require('bunyan');

var createCloudWatchStream = require('bunyan-cloudwatch');

function LogStream() {
}
LogStream.prototype.constructor = LogStream;
LogStream.prototype._validateStringParam = function(param, message) {
  if (!param || (param && !(typeof param === 'string' || param instanceof String))) {
    throw new TypeError(message);
  }
};
LogStream.prototype._getValidLevel = function(level) {
  var returnValue;

  var LOG_LEVELS = [ 'trace', 'debug', 'info', 'warn', 'error', 'fatal' ];
  if (level) {
    if (LOG_LEVELS.indexOf(level) < 0) {
      throw new TypeError('Invalid log level');
    }

    returnValue = level;
  } else {
    returnValue = 'info';
  }

  return returnValue;
};
LogStream.prototype.createLogger = function(fields) {
  var returnValue;

  if (fields) {
    returnValue = this.rootLogger.child(fields);
  } else {
    returnValue = this.rootLogger.child();
  }

  return returnValue;
};


function FileStream(config) {
  LogStream.call(this);

  this._validateStringParam(config.name, 'The application name must be defined as a string');
  this._validateStringParam(config.path, 'The path must be defined as a string.');

  var level = this._getValidLevel(config.level);

  this.rootLogger = bunyan.createLogger({
    name: config.name,
    streams: [
      {
        name:  config.name,
        path:  config.path,
        level: level
      }
    ]
  });
}
FileStream.prototype = Object.create(LogStream.prototype);
FileStream.prototype.constructor = FileStream;

function SimpleStream(config) {
  LogStream.call(this);

  this._validateStringParam(config.name, 'The application name must be defined as a string');

  var level = this._getValidLevel(config.level);

  this.rootLogger = bunyan.createLogger({
    name: config.name,
    streams: [
      {
        stream: process.stdout,
        level: level
      }
    ]
  });
}
SimpleStream.prototype = Object.create(LogStream.prototype);
SimpleStream.prototype.constructor = SimpleStream;

function CloudWatchStream(config) {
  LogStream.call(this);

  this._validateStringParam(config.name, 'The application name must be defined as a string');
  this._validateStringParam(config.region, 'The region must be defined as a string');
  this._validateStringParam(config.groupName, 'The groupName must be defined as a string');
  this._validateStringParam(config.streamName, 'The streamName must be defined as a string');

  var level = this._getValidLevel(config.level);

  var cloudWatchStream = createCloudWatchStream({
    region: config.region,
    logGroupName: config.groupName,
    logStreamName: config.streamName
  });

  this.rootLogger = bunyan.createLogger({
    name: config.name,
    streams: [
      {
        stream: cloudWatchStream,
        type:   'raw',
        level:  level
      }
    ]
  });
}
CloudWatchStream.prototype = Object.create(LogStream.prototype);
CloudWatchStream.prototype.constructor = CloudWatchStream;

function LoggerFactory(options) {
  var LOGGERS = [ 'SimpleStream', 'FileStream', 'CloudWatchStream' ];

  var config = options.config;
  if (!config) {
    throw new TypeError('The configuration must be supplied.');
  }

  switch(options.type) {
    case 'SimpleStream':
      this.stream = new SimpleStream(config);
      break;
    case 'FileStream':
      this.stream = new FileStream(config);
      break;
    case 'CloudWatchStream':
      this.stream = new CloudWatchStream(config);
      break;
    default:
      throw new TypeError('The type must be one of ' + LOGGERS.join(', '));
  }
}
LoggerFactory.prototype.getLogger = function(fields) {
  var returnValue;

  if (fields) {
    returnValue = this.stream.createLogger(fields);
  } else {
    returnValue = this.stream.createLogger();
  }

  return returnValue;
};

module.exports = {
  LoggerFactory: LoggerFactory
};
