/* jshint bitwise: false */

'use strict';

var Bluebird = require('bluebird');

var collection = require('./collection');

var errors = require('./../../error'),
    ResourceNotFoundError = errors.ResourceNotFoundError;

// Polyfill
if (!Array.prototype.find) {
  Array.prototype.find = function(predicate) {
    if (this === null) {
      throw new TypeError('Array.prototype.find called on null or undefined');
    }
    if (typeof predicate !== 'function') {
      throw new TypeError('predicate must be a function');
    }
    var list = Object(this);
    var length = list.length >>> 0;
    var thisArg = arguments[1];
    var value;

    for (var i = 0; i < length; i++) {
      value = list[i];
      if (predicate.call(thisArg, value, i, list)) {
        return value;
      }
    }
    return undefined;
  };
}

function findThing(things, thingId, context) {
  var methodName = 'single#findThing()';

  var returnValue;

  if (things && Array.isArray(things)) {
    returnValue = things.find(function(element) {
      return element.thingId === thingId;
    });
  }

  context.logger.info({ things: things, result: returnValue }, methodName);

  return returnValue;
}

var retrieveThing = function(message, context, iot) {
  var methodName = 'single#retrieveThing()';

  context.logger.info( { message: message }, methodName);

  return Bluebird.resolve()
    .then(function() {
        return collection({}, context, iot)
      })
    .then(function(things) {
        return findThing(things, message.thingId, context);
      })
    .then(function(thing) {
        if (!thing) {
          throw new ResourceNotFoundError('The resource with thingId of ' + message.thingId +
            ' does not exist or is not associated with a principal');
        }

        return thing;
      });
};

// Export For Lambda Handler
module.exports = retrieveThing;
