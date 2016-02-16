'use strict';

var Bluebird = require('bluebird'),
    deepcopy = require('deepcopy');

var ValidationManager = require('./../../model/validationmanager').ValidationManager;

var errors = require('./../../error'),
    UnknownError = errors.UnknownError;

var schema = require('./../../model/things/update/request');

var single = require('./single');

function transformRequest(message, context) {
  var request = {
    thingName: message.thingId
  };

  if (message.hasOwnProperty('attributes')) {
    request.attributePayload = {
      attributes: deepcopy(message.attributes)
    };
  }
  context.logger.info({ message: message, request: request }, 'create#transformRequest()');

  return request;
}

function transformResponse(thing) {
  var returnValue = {
    thingId: thing.thingId
  };

  if (thing.hasOwnProperty('attributes')) {
    var attributes = thing.attributes;
    if (Object.keys(attributes).length > 0) {
      returnValue.attributes = deepcopy(thing.attributes);
    }
  }

  return returnValue;
}

function handleError(err, context) {
  context.logger.info( { error: err }, 'update#handleError()');

  var condition;
  if (err.hasOwnProperty('statusCode')) {
    switch (err.statusCode) {
      default:
        var statusCode = -1 || err.statusCode;
        condition = new UnknownError(statusCode, err.message);
        break;
    }
  } else {
    condition = err;
  }

  throw condition;
}

var updateThing = function(message, context, iot) {
  var iotUpdateThing = Bluebird.promisify(iot.updateThing, { context: iot });

  return new ValidationManager(context).validate(message, schema)
    .then(function() {
        var params = {
          thingId: message.thingId
        };

        return single(params, context, iot);
      })
    .then(function() {
        return transformRequest(message, context);
      })
    .then(iotUpdateThing)
    .then(function() {
        return transformResponse(message);
      })
    .catch(function(err) {
        handleError(err, context);
      });
};

// Export For Lambda Handler
module.exports = updateThing;
