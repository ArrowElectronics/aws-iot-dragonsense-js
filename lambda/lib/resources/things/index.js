/**
 * AWS Module: Action: Modularized Code
 */

'use strict';

var AWS = require('aws-sdk');

var ValidationManager = require('./../../model/validationmanager').ValidationManager;

var requestSchema = require('./../../model/things/command');

var invokeAction =
  function(event, context) {
    var methodName = 'things#invokeAction()';

    if (context.hasOwnProperty('config')) {
      var config = context.config;
      if (config.hasOwnProperty('aws')) {
        var awsConfig = config.aws;

        context.logger.info({ awsConfig: awsConfig }, methodName);

        AWS.config.update(awsConfig);
      }
    }

    var action;
    switch(event.action) {
      case 'retrieve': {
        action = require('./retrieve');
        break;
      }
      case 'update': {
        action = require('./update');
        break;
      }
      default:
        throw new TypeError('Unable to handle action type of ' + event.action);
    }

    return action(event.message, context, new AWS.Iot());
  };

var manageThings = function(event, context, callback) {
  var methodName = 'things#manageThings()';

  new ValidationManager(context).validate(event, requestSchema)
    .then(function() {
        return invokeAction(event, context);
      })
    .then(function(result) {
        context.logger.info({ result: result }, methodName);

        return callback(null, result);
      })
    .catch(function(err) {
        return callback(err, null);
      });
};

// Export For Lambda Handler
module.exports = manageThings;
