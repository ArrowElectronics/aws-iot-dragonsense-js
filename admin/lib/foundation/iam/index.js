'use strict';

var AWS = require('aws-sdk'),
    Bluebird = require('bluebird'),
    randomString = require('randomr');

var config = require('dragonsense-config'),
    SimpleError = require('./../../errors/simpleerror'),
    configureAws = require('./../../util/helper').configureAws;

var roles = require('./roles');

var DynamicRoleHelper = require('./dynamicrolehelper');

/* AWS has an issue with creating, deleting, and re-creating roles with the same name (or a slight variation).
 * Once this cycle has happened a number of times, the associated function (the case where this issue was
 * discovered involved Lambda functions) will throw a credential error.  For example, when the Lambda function
 * returned the following error:  "The security token included in the request is invalid."  If the same role
 * was created using a different name, then the Lambda function would execute as expected.
 *
 * The following appends a random hexidecimal string to the end of the role name to prevent the issue.
 */
var DYNAMIC_ROLE = true;
var IDENTIFIER_LENGTH = 4;

function createRole(iam, role) {
  console.info('Creating role ' + role.name);

  if (!role.alias && !(typeof role.alias === 'string' || role.alias instanceof String)) {
    throw new TypeError('The role alias must be set.');
  }

  var createRole = Bluebird.promisify(iam.createRole, { context: iam });

  var params = {
    RoleName: role.alias,
    AssumeRolePolicyDocument: JSON.stringify(role.trustDocument, null, 2)
  };

  return createRole(params)
    .catch(function(err) {
        switch (err.statusCode) {
          case 409: {
            throw new SimpleError('Role Already Exists', err.message);
          }
          default: {
            throw new SimpleError('Unclassified Error Occurred', err.message);
          }
        }
      });
}

function attachInlinePolicies(iam, role) {
  var awsPutRolePolicy = Bluebird.promisify(iam.putRolePolicy, { context: iam });

  if (!role.alias && !(typeof role.alias === 'string' || role.alias instanceof String)) {
    throw new TypeError('The role alias must be set.');
  }

  if (role.inlinePolicies) {
    return Bluebird.each(Object.keys(role.inlinePolicies), function(policyName) {
          var policy = role['inlinePolicies'][policyName];

          var params = {
            RoleName: role.alias,
            PolicyName: policyName,
            PolicyDocument: JSON.stringify(policy, null, 2)
          };

          return awsPutRolePolicy(params);
        })
      .catch(function(err) {
          throw err;
        });
  }
}

function attachManagedPolicies(iam, role) {
  var awsAttachRolePolicy = Bluebird.promisify(iam.attachRolePolicy, { context: iam });

  if (!role.alias && !(typeof role.alias === 'string' || role.alias instanceof String)) {
    throw new TypeError('The role alias must be set.');
  }

  if (role.managedPolicies) {
    return Bluebird.each(role.managedPolicies, function(policyArn) {
          var params = {
            RoleName: role.alias,
            PolicyArn: policyArn
          };

          return awsAttachRolePolicy(params);
        })
      .catch(function(err) {
          throw err;
        });
  }
}

function createResources() {
  configureAws(AWS);

  var iam = new AWS.IAM();

  var dynamicRoleHelper = new DynamicRoleHelper(iam);

  var ext = randomString(IDENTIFIER_LENGTH, 'hex');
  return Bluebird.each(Object.keys(roles), function(roleRef) {
    var role = roles[roleRef];

    role.name = config['iam'][roleRef]['roleName'];
    if (DYNAMIC_ROLE) {
      role.alias = role.name.concat('-', ext);
    } else {
      role.alias = role.name;
    }

    return dynamicRoleHelper.findRole(role.name)
      .then(function(existingRole) {
          if (existingRole) {
            console.info('Role ' + existingRole.RoleName + ' already exists.');
          } else {
            return createRole(iam, role)
              .then(function() {
                  return attachManagedPolicies(iam, role);
                })
              .then(function() {
                  return attachInlinePolicies(iam, role);
                })
              .catch(function(err) {
                  throw err;
                });
          }
        })
      .catch(function(err) {
          throw err;
        });
  });
}

function deleteRole(iam, role) {
  if (!role.alias && !(typeof role.alias === 'string' || role.alias instanceof String)) {
    throw new TypeError('The role alias must be set.');
  }

  console.info('Deleting role ' + role.alias);

  var awsDetachRolePolicy = Bluebird.promisify(iam.detachRolePolicy, { context: iam });
  var awsDeleteRolePolicy = Bluebird.promisify(iam.deleteRolePolicy, { context: iam });
  var awsDeleteRole = Bluebird.promisify(iam.deleteRole, { context: iam });

  return Bluebird.resolve()
    .then(function() {
        if (role.managedPolicies) {
          return Bluebird.each(role.managedPolicies, function (policyArn) {
                return awsDetachRolePolicy({
                      RoleName: role.alias,
                      PolicyArn: policyArn
                    })
                  .catch(function(err) {
                      throw err;
                    });
              })
            .catch(function(err) {
                throw err;
              });
        }
      })
    .then(function() {
        if (role.inlinePolicies) {
          return Bluebird.each(Object.keys(role.inlinePolicies), function(policyName) {
              return awsDeleteRolePolicy({
                      RoleName: role.alias,
                      PolicyName: policyName
                  })
                .catch(function (err) {
                    throw err;
                  });
              })
            .catch(function(err) {
                throw err;
              });
        }
      })
    .then(function() {
        return awsDeleteRole({
              RoleName: role.alias
            })
          .catch(function(err) {
              throw err;
            });
      })
    .catch(function(err) {
        throw err;
      });
}

function deleteResources() {
  configureAws(AWS);

  var iam = new AWS.IAM();

  if (DYNAMIC_ROLE) {
    var dynamicRoleHelper = new DynamicRoleHelper(iam);

    return Bluebird.each(Object.keys(roles), function(roleRef) {
          var role = roles[roleRef];
          var roleName = config['iam'][roleRef]['roleName'];

          return dynamicRoleHelper.findRole(roleName)
            .then(function(existingRole) {
                if (existingRole) {
                  role.name = roleName;
                  role.alias = existingRole.RoleName;

                  return deleteRole(iam, role);
                }
              })
            .catch(function(err) {
                throw err;
              });
        })
      .catch(function(err) {
          throw err;
        });
  } else {
    return Bluebird.each(Object.keys(roles), function(roleRef) {
          var role = roles[roleRef];
          role.name = config['iam'][roleRef]['roleName'];
          role.alias = role.name;

          return deleteRole(iam, role);
        })
      .catch(function(err) {
          throw err;
        });
  }
}

var manage = function(cmd) {
  switch(cmd) {
    case 'create':
      return createResources();
      break;
    case 'delete':
      return deleteResources();
      break;
    default:
      throw new TypeError('Unknown command of ' + cmd);
  }
};

module.exports = manage;
