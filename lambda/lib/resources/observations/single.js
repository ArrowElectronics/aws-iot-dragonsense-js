'use strict';

var Bluebird = require('bluebird'),
    dynamoDoc = require('dynamodb-doc'),
    deepcopy = require('deepcopy');

var config = require('dragonsense-config');

var errors = require('./../../error'),
    AccessDeniedError = errors.AccessDeniedError,
    ResourceNotFoundError = errors.ResourceNotFoundError,
    UnknownError = errors.UnknownError;

var ValidationManager = require('./../../model/validationmanager').ValidationManager;
var requestSchema = require('./../../model/observations/retrieve/request');

var findSensor = require('./../sensors/single');

function createRetrievalParams(message, context) {
  var methodName = 'observations-single-retrieve#createRetrievalParams()';

  var returnValue = {
    TableName:  config.dynamodb.observations.name,
    ScanIndexForward: false,
    KeyConditionExpression: 'sensorId = :sensorId and observationId = :observationId',
    ExpressionAttributeValues: {
      ':sensorId': message.sensorId,
      ':observationId': message.observationId
    }
  };
  context.logger.info( { message: message, params: returnValue }, methodName);

  return returnValue;
}

function transformResponse(message, result, context) {
  var methodName = 'observations-single-retrieve#transformResponse()';

  var returnValue;
  switch(result.Items.length) {
    case 0: {
      throw new ResourceNotFoundError('Observation with identifier of ' + message.observationId +
        ' was not found for sensor with identifier of ' + message.sensorId +
        ' associated with thing with identifier of ' + message.thingId);
    }
    case 1: {
      var item = result.Items[0];
      returnValue = JSON.parse(item.observation);
      returnValue.observationId = item.observationId;

      break;
    }
    default: {
      throw new ReferenceError('Unexpected number of results found for thing with identifier of ' + message.thingId);
    }
  }

  context.logger.info({ thingId: message.thingId, result: result, response: returnValue }, methodName);

  return returnValue;
}

function handleError(err, context) {
  var methodName = 'observations-single-retrieve#handleError()';

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

var retrieve = function(message, context, AWS) {
  var iot = new AWS.Iot();
  var dynamoDb = dynamoDoc.DynamoDB(new AWS.DynamoDB());

  var query = Bluebird.promisify(dynamoDb.query, { context: dynamoDb });

  return new ValidationManager(context).validate(message, requestSchema)
    .then(function() {
        var params = {
          thingId: message.thingId,
          sensorId: message.sensorId
        };

        return findSensor(params, context, AWS);
      })
    .then(function() {
        return createRetrievalParams(message, context);
      })
    .then(query)
    .then(function(result) {
        return transformResponse(message, result, context);
      })
    .catch(function(err) {
        handleError(err, context);
      });
};

module.exports = retrieve;