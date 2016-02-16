'use strict';

var Bluebird = require('bluebird'),
    deepcopy = require('deepcopy');

var config = require('dragonsense-config');

var errors = require('./../../error'),
    AccessDeniedError = errors.AccessDeniedError,
    UnknownError = errors.UnknownError;

function containPolicy(policies, policyName, context) {
  var methodName = 'things-collection#containPolicy()';

  context.logger.debug( { policies: policies, policyName: policyName }, methodName);

  var returnValue = false;

  for (var i = 0; i < policies.length; i++) {
    var policy = policies[i];
    if (policy.hasOwnProperty('policyName') && policy['policyName'] === policyName) {
      returnValue = true;
      break;
    }
  }

  context.logger.debug( { contains: returnValue }, methodName);

  return returnValue;
}

function thingPrincipalFilter(thing, context, iot) {
  var methodName = 'things-collection#thingPrincipalFilter()';

  var iotListThingPrincipals = Bluebird.promisify(iot.listThingPrincipals, { context: iot });
  var iotListPrincipalPolicies = Bluebird.promisify(iot.listPrincipalPolicies, { context: iot });

  var params = {
    thingName: thing.thingName
  };

  return iotListThingPrincipals(params)
    .then(function(result) {
        var returnValue;

        if (result && result.hasOwnProperty('principals')) {
          var principals = result.principals;
          if (Array.isArray(principals) && principals.length > 0) {
            returnValue = principals[0];
          }
        }

        return returnValue;
      })
    .then(function(principal) {
        if (principal) {
          context.logger.info({ principal: principal }, methodName);

          return iotListPrincipalPolicies({
                principal: principal
              })
            .then(function(result) {
                return containPolicy(result.policies, config.iot.policies.DragonSenseThing, context);
              })
            .catch(function(err) {
                throw err;
              });
        } else {
          context.logger.info('No principal found:  ' + methodName);

          return false;
        }
      })
    .catch(function(err) {
        throw err;
      });
}

function transformResponse(things, context) {
  var returnValue = [];

  if (things && Array.isArray(things)) {
    for (var i = 0; i < things.length; i++) {
      var thing = things[i];

      var entity = {
        thingId: thing.thingName
      };

      if (thing.hasOwnProperty('attributes')) {
        var attributes = thing.attributes;
        if (Object.keys(attributes).length > 0) {
          entity.attributes = deepcopy(thing.attributes);
        }
      }

      returnValue.push(entity);
    }
  }

  context.logger.info({ things: things, response: returnValue }, 'things-collection#transformResponse()');

  return returnValue;
}

function handleError(err, context) {
  context.logger.info( { error: err }, 'things-collection#handleError()');

  var condition;
  if (err.hasOwnProperty('statusCode')) {
    switch (err.statusCode) {
      case 403:
        condition = new AccessDeniedError(err.message);
        break;
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

var retrieveThings = function(message, context, iot) {
  var methodName = 'things-collection#retrieveThings()';

  var iotListThings = Bluebird.promisify(iot.listThings, { context: iot });

  return iotListThings(message)
    .then(function(thingList) {
        return thingList.things;
      })
    .filter(function(thing) {
        return thingPrincipalFilter(thing, context, iot);
      })
    .then(function(result) {
        return transformResponse(result, context);
      })
    .catch(function(err) {
        handleError(err, context);
      });
};

// Export For Lambda Handler
module.exports = retrieveThings;
