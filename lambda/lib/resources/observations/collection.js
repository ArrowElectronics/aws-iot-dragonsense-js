'use strict';

var Bluebird = require('bluebird'),
    dynamoDoc = require('dynamodb-doc');

var config = require('dragonsense-config');

var errors = require('./../../error'),
    AccessDeniedError = errors.AccessDeniedError,
    ResourceNotFoundError = errors.ResourceNotFoundError,
    UnknownError = errors.UnknownError;

var ValidationManager = require('./../../model/validationmanager').ValidationManager;
var requestSchema = require('./../../model/observations/retrieve/request');

var findSensorBySensorId = require('./../sensors/single');
var findSensorBySystemId = require('./../sensors/find');

function createRetrievalParams(message, context) {
  var methodName = 'observations-collection-retrieve#createRetrievalParams()';

  var returnValue = {
    TableName: config.dynamodb.observations.name,
    IndexName: config.dynamodb.observations.observationHistoryIndex,
    ScanIndexForward: false,
    KeyConditionExpression: 'sensorId = :sensorId',
    ExpressionAttributeValues: {
      ':sensorId': message.sensorId
    }
  };

  if (message.limit) {
    returnValue.Limit = message.limit;
  }

  context.logger.info( { message: message, params: returnValue }, methodName);

  return returnValue;
}

function transformResponse(message, result, context) {
  var methodName = 'observations-collection-retrieve#transformResponse()';

  var returnValue = [];

  var items = result.Items;
  for (var i = 0; i < items.length; i++) {
    var item = items[i];

    var observation = JSON.parse(item.observation);
    observation.observationId = item.observationId;
    observation.thingId = message.thingId;
    observation.sensorId = message.sensorId;
    observation.systemId = message.systemId;

    returnValue.push(observation);
  }

  if (returnValue.length > 0) {
    context.logger.debug( { observationSample: returnValue[0] }, methodName);
  }

  context.logger.info({ thingId: message.thingId, responseCount: returnValue.length }, methodName);

  return returnValue;
}

function handleError(err, context) {
  var methodName = 'observations-collection-retrieve#handleError()';

  context.logger.info( { error: err }, methodName);

  var condition;
  if (err && err.hasOwnProperty('statusCode')) {
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

function getObservations(message, context, AWS) {
  var dynamoDb = dynamoDoc.DynamoDB(new AWS.DynamoDB());

  var query = Bluebird.promisify(dynamoDb.query, { context: dynamoDb });

  return Bluebird.resolve()
    .then(function() {
        return createRetrievalParams(message, context)
      })
    .then(query)
    .then(function(result) {
        return transformResponse(message, result, context);
      })
    .catch(function(err) {
        throw err;
      });
}

var retrieve = function(message, context, AWS, validate) {
  var thingId;

  if (!validate) {
    return getObservations(message, context, AWS);
  } else {
    return new ValidationManager(context).validate(message, requestSchema)
      .then(function() {
          thingId = message.thingId;

          if (message.hasOwnProperty('sensorId')) {
            var params = {
              thingId: thingId,
              sensorId: message.sensorId
            };

            return findSensorBySensorId(params, context, AWS);
          } else {
            return findSensorBySystemId(thingId, message.systemId, context, AWS);
          }
        })
      .then(function(sensor) {
          if (!sensor) {
            var errorMessage = 'Thing with identifier of ' + thingId + ' does not have an associated sensor with ';

            if (message.hasOwnProperty('sensorId')) {
              errorMessage += ' identifier of ' + message.sensorId;
            } else {
              errorMessage += ' a system identifier of ' + message.systemId;
            }

            throw new ResourceNotFoundError(errorMessage);
          } else {
            var params = {
              thingId: thingId,
              sensorId: sensor.sensorId,
              systemId: sensor.systemId,
              limit: message.limit
            };

            return getObservations(params, context, AWS);
          }
        })
      .catch(function(err) {
          handleError(err, context);
        });
  }
};

module.exports = retrieve;