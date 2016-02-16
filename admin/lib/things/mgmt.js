'use strict';

var fs = require('fs'),
    path = require('path');

var AWS = require('aws-sdk'),
    Bluebird = require('bluebird'),
    mkdirp = require('mkdirp'),
    homedir = require('home-dir'),
    rimraf = require('rimraf');

var config = require('dragonsense-config'),
    SimpleError = require('./../errors/simpleerror'),
    configureAws = require('./../util/helper').configureAws;

var REGISTRY_BASE = './../../registry';
var KEYS_AND_CERTIFICATES_FILE_NAME = 'certificatesAndKeys.json';

var RESOURCE_NOT_FOUND_ERROR = 'ResourceNotFoundError';

function getRegistry(thingId) {
  return path.join(homedir(), config.admin.registry, thingId);
}

function getThing(iot, context) {
  var awsDescribeThing = Bluebird.promisify(iot.describeThing, { context: iot });
  var awsListThingPrincipals = Bluebird.promisify(iot.listThingPrincipals, { context: iot });

  var params = {
    thingName: context.thingId
  };

  return awsDescribeThing(params)
    .then(function(thing) {
        return awsListThingPrincipals({
              thingName: thing.thingName
            })
          .then(function(result) {
              var principals = result.principals;
              if (principals.length > 0) {
                return {
                  thingId: thing.thingName,
                  attributes: thing.attributes,
                  principal: principals[0]
                }
              }

              throw new SimpleError(RESOURCE_NOT_FOUND_ERROR);
            })
          .catch(function(err) {
              throw err;
            });
      })
    .catch(function(err) {
        if (err.statusCode === 404) {
          throw new SimpleError(RESOURCE_NOT_FOUND_ERROR, err);
        }

        throw err;
      });
}

function getOrCreateThing(iot, context) {
  return getThing(iot, context)
    .catch(function(err) {
        if (err.name === 'SimpleError' && err.condition === RESOURCE_NOT_FOUND_ERROR) {
          return createThing(iot, context);
        }

        throw err;
      });
}

function createThing(iot, context) {
  console.info('Creating thing ' + context.thingId);

  var awsCreateThing = Bluebird.promisify(iot.createThing, { context: iot });

  var attributes = {
    reference: 'ArrowDragonSense'
  };

  var params = {
    thingName: context.thingId,
    attributePayload: {
      attributes: attributes
    }
  };

  return awsCreateThing(params)
    .then(function() {
        return createPrincipal(iot, context);
      })
    .then(function(keyAndCertificates) {
        return attachPrincipalToThing(iot, keyAndCertificates.certificateArn, context)
          .then(function() {
              return {
                thingId: context.thingId,
                attributes: attributes,
                principal: keyAndCertificates.certificateArn
              };
            })
          .catch(function(err) {
              throw err;
            });
      });
}

function createPrincipal(iot, context) {
  console.info('Creating principal');

  var mkdir = Bluebird.promisify(mkdirp);
  var awsCreateKeysAndCertificate = Bluebird.promisify(iot.createKeysAndCertificate, { context: iot });

  var thingRegistry = getRegistry(context.thingId);

  return mkdir(thingRegistry)
    .then(function() {
        return awsCreateKeysAndCertificate({
            setAsActive: true
        })
      })
    .then(function(data) {
        fs.writeFileSync(path.join(thingRegistry, KEYS_AND_CERTIFICATES_FILE_NAME),
          JSON.stringify(data, null, 2));
        fs.writeFileSync(path.join(thingRegistry, 'aws.crt'), data.certificatePem);
        fs.writeFileSync(path.join(thingRegistry, 'aws.key'), data.keyPair.PrivateKey);

        return data;
      });
}

function attachPrincipalToThing(iot, certificateArn, context) {
  console.info('Attaching principal to thing ' + context.thingId);

  var awsAttachThingPrincipal = Bluebird.promisify(iot.attachThingPrincipal, { context: iot });

  return Bluebird.resolve()
    .then(function() {
      return awsAttachThingPrincipal({
        principal: certificateArn,
        thingName: context.thingId
      })
    })
}

function attachPolicyToPrincipal(iot, thing) {
  var policyName = config.iot.policies.DragonSenseThing;

  console.info('Attaching policy ' + policyName + ' to principal for thing ' + thing.thingId);

  var awsAttachPrincipalPolicy = Bluebird.promisify(iot.attachPrincipalPolicy, { context: iot });

  return awsAttachPrincipalPolicy({
        policyName: policyName,
        principal: thing.principal
      });
}

function validatePolicy(iot) {
  var awsGetPolicy = Bluebird.promisify(iot.getPolicy, { context: iot });

  return awsGetPolicy({
        policyName: config.iot.policies.DragonSenseThing
      })
    .catch(function(err) {
        throw new TypeError('Policy ' + config.iot.policies.DragonSenseThing + ' must exist before creating a thing');
      });
}

function createResources(context) {
  configureAws(AWS);

  var iot = new AWS.Iot();

  return validatePolicy(iot)
    .then(function() {
        return getOrCreateThing(iot, context)
      })
    .then(function(thing) {
        return attachPolicyToPrincipal(iot, thing);
      })
    .catch(function(err) {
        console.error('ERROR');
        console.error('  Message: ' + err.message);
      });
}

function deletePrincipal(iot, certificateId, context) {
  console.info('Deleting principal');

  var awsUpdateCertificate = Bluebird.promisify(iot.updateCertificate, { context: iot });
  var awsDeleteCertificate = Bluebird.promisify(iot.deleteCertificate, { context: iot });

  return awsUpdateCertificate({
        certificateId: certificateId,
        newStatus: 'INACTIVE'
      })
    .then(function() {
        return awsDeleteCertificate({
          certificateId: certificateId
        })
      });
}

function deleteThing(iot, context) {
  console.info('Deleting thing ' + context.thingId);

  var awsDeleteThing = Bluebird.promisify(iot.deleteThing, { context: iot });

  return awsDeleteThing({
        thingName: context.thingId
      });
}

function detachPrincipalFromThing(iot, certificateArn, context) {
  console.info('Detaching principal from thing ' + context.thingId);

  var awsDetachThingPrincipal = Bluebird.promisify(iot.detachThingPrincipal, { context: iot });

  return awsDetachThingPrincipal({
        principal: certificateArn,
        thingName: context.thingId
      });
}

function detachPoliciesFromPrincipal(iot, certificateArn, context) {

  var awsListPrincipalPolicies = Bluebird.promisify(iot.listPrincipalPolicies, { context: iot });
  var awsDetachPrincipalPolicy = Bluebird.promisify(iot.detachPrincipalPolicy, { context: iot });

  return awsListPrincipalPolicies({
        principal: certificateArn
      })
    .then(function(result) {
      Bluebird.each(result.policies, function(policyRef) {
          var policyName = policyRef.policyName;

          console.info('Detaching policy ' + policyName + ' from principal for thing ' + context.thingId);

          return awsDetachPrincipalPolicy({
            policyName: policyName,
            principal: certificateArn
          })
        })
      .catch(function (err) {
        throw err;
      })
    });
}

function deleteResources(context) {
  configureAws(AWS);

  var rmdir = Bluebird.promisify(rimraf);

  var iot = new AWS.Iot();

  var thingRegistry = getRegistry(context.thingId);

  return getThing(iot, context)
    .then(function(thing) {
        var certificateArn = thing.principal;
        var certificateId = /.*cert\/(.*)/.exec(certificateArn)[1];

        detachPoliciesFromPrincipal(iot, certificateArn, context)
          .then(function() {
              return detachPrincipalFromThing(iot, certificateArn, context);
            })
          .then(function() {
              return deletePrincipal(iot, certificateId, context);
            })
          .then(function() {
              return deleteThing(iot, context)
            })
          .then(function() {
              rmdir(thingRegistry);
            })
          .catch(function(err) {
              throw err;
            });
      })
    .catch(function(err) {
        console.error('ERROR');
        console.error('  Message:  ' + err.message);
      });
}

var manage = function(cmd, context) {
  switch(cmd) {
    case 'create':
      return createResources(context);
      break;
    case 'delete':
      return deleteResources(context);
      break;
    default:
      throw new TypeError('Unknown command of ' + cmd);
  }
};

module.exports = manage;
