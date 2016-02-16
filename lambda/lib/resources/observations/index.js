/**
 * AWS Module: Action: Modularized Code
 */

'use strict';

var AWS = require('aws-sdk'),
    Bluebird = require('bluebird');

var ValidationManager = require('./../../model/validationmanager').ValidationManager;

var requestSchema = require('./../../model/observations/command');

function configureAws(context) {
  var methodName = 'observations#configureAws()';

  if (context.hasOwnProperty('config')) {
    var config = context.config;
    if (config.hasOwnProperty('aws')) {
      var awsConfig = config.aws;

      context.logger.info({ awsConfig: awsConfig }, methodName);

      AWS.config.update(awsConfig);
    }
  }
}

function invokeAction(event, context) {
  var action;
  switch (event.action) {
    case 'retrieve': {
      action = require('./retrieve');
      break;
    }
    case 'create': {
      action = require('./create');
      break;
    }
    case 'delete': {
      action = require('./delete');
      break;
    }
    default:
      throw new TypeError('Unable to handle action type of ' + event.action);
  }

  return Bluebird.resolve()
    .then(function() {
        return action(event.message, context, AWS);
      })
    .catch(function(err) {
        throw err;
      });
}

var manage = function(event, context, callback) {
  var methodName = 'observations#manage()';

  new ValidationManager(context).validate(event, requestSchema)
    .then(function() {
        return configureAws(context)
      })
    .then(function() {
        return invokeAction(event, context)
      })
    .then(function(result) {
        context.logger.info({ result: result }, methodName);

        return callback(null, result);
      })
    .catch(function(ex) {
        return callback(ex, null);
      })
};

// Export For Lambda Handler
module.exports = manage;
