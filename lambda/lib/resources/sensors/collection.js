'use strict';

var Bluebird = require('bluebird'),
    dynamoDoc = require('dynamodb-doc'),
    deepcopy = require('deepcopy');

var config = require('dragonsense-config');

var errors = require('./../../error'),
    AccessDeniedError = errors.AccessDeniedError,
    UnknownError = errors.UnknownError;

var ValidationManager = require('./../../model/validationmanager').ValidationManager;
var requestSchema = require('./../../model/sensors/retrieve/request');

var single = require('./../things/single');

function createRetrievalParams(message, context) {
  var methodName = 'sensors-collection-retrieve#createRetrievalParams()';

  var returnValue = {
    TableName:  config.dynamodb.sensors.name,
    KeyConditionExpression: 'thingId = :thingId',
    ExpressionAttributeValues: {
      ':thingId': message.thingId
    }
  };

  context.logger.info( { message: message, params: returnValue }, methodName);

  return returnValue;
}

function transformResponse(message, result, context) {
  var methodName = 'sensors-collection-retrieve#transformResponse()';

  context.logger.info({ result: result }, methodName);

  var returnValue = [];

  var items = result.Items;
  for (var i = 0; i < items.length; i++) {
    var item = items[i];

    var sensor = deepcopy(item.sensor);
    sensor.sensorId = item.sensorId;

    returnValue.push(sensor);
  }

  context.logger.info({ thingId: message.thingId, response: returnValue }, methodName);

  return returnValue;
}

function handleError(err, context) {
  var methodName = 'sensors-collection-retrieve#handleError()';

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

  var thingId = message.thingId;

  return new ValidationManager(context).validate(message, requestSchema)
    .then(function() {
        // Ensure that the thing exists and is associated with a principal

        var params = {
          thingId: thingId
        };

        return single(params, context, iot);
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