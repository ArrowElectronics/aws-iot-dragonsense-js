var AWS = require('aws-sdk'),
    Bluebird = require('bluebird');

var config = require('dragonsense-config'),
    configureAws = require('./../../util/helper').configureAws;

function isPolicyApplicable(iot, thing) {
  var iotListPrincipalPolicies = Bluebird.promisify(iot.listPrincipalPolicies, { context: iot });

  return iotListPrincipalPolicies({
        principal: thing.principal
      })
    .then(function(result) {
        var returnValue = false;

        var policies = result.policies;
        for (var i = 0; i < policies.length; i++) {
          var policy = policies[i];
          if (policy.policyName === config.iot.policies.DragonSenseThing) {
            returnValue = true;
            break;
          }
        }

        return returnValue;
      })
    .catch(function(err) {
        throw err;
      });
}

function detachPrincipal(iot, thing) {
  console.info('Detaching thing ' + thing.thingId + ' from policy ' + config.iot.policies.DragonSenseThing);

  var iotDetachPrincipalPolicy = Bluebird.promisify(iot.detachPrincipalPolicy, { context: iot });

  return iotDetachPrincipalPolicy({
        policyName: config.iot.policies.DragonSenseThing,
        principal: thing.principal
      })
    .catch(function(err) {
        throw err;
      });
}

function associatePrincipal(iot, thing) {
  var iotListThingPrincipals = Bluebird.promisify(iot.listThingPrincipals, { context: iot });

  return iotListThingPrincipals({
        thingName: thing.thingName
      })
    .then(function(result) {
        var returnValue = {
          thingId: thing.thingName,
          attributes: thing.attributes
        };

        var principals = result.principals;
        if (principals.length > 0) {
          returnValue.principal = principals[0];
        }

        return returnValue;
      })
    .catch(function(err) {
        throw err;
      });
}

function cleanup() {
  configureAws(AWS);

  var iot = new AWS.Iot();

  var iotListThings = Bluebird.promisify(iot.listThings, { context: iot });

  return iotListThings({})
    .then(function(thingList) {
        return thingList.things;
      })
    .map(function(thing) {
        return associatePrincipal(iot, thing);
      })
    .filter(function(thing) {
        return thing.hasOwnProperty('principal');
      })
    .filter(function(thing) {
        return isPolicyApplicable(iot, thing);
      })
    .each(function(thing) {
        return detachPrincipal(iot, thing);
      })
    .catch(function(err) {
        throw err;
      });
}

var manage = function(cmd) {
  switch(cmd) {
    case 'create':
      break;
    case 'delete':
      return cleanup();
      break;
    default:
      throw new TypeError('Unknown command of ' + cmd);
  }
};

module.exports = manage;