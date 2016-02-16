'use strict';

var Bluebird = require('bluebird'),
    dynamoDoc = require('dynamodb-doc'),
    deepcopy = require('deepcopy');

var config = require('dragonsense-config');

var errors = require('./../../error'),
    AccessDeniedError = errors.AccessDeniedError,
    UnknownError = errors.UnknownError;

var single = require('./../things/single');

function createRetrievalParams(thingId, systemId, context) {
  var methodName = 'sensors-find#createRetrievalParams()';

  var returnValue = {
    TableName:  config.dynamodb.sensors.name,
    KeyConditionExpression: 'thingId = :thingId AND systemId = :systemId',
    IndexName: config.dynamodb.sensors.sensorIdentificationIndex,
    ExpressionAttributeValues: {
      ':thingId': thingId,
      ':systemId': systemId
    }
  };

  context.logger.info( { params: returnValue }, methodName);

  return returnValue;
}

function transformResponse(thingId, result, context) {
  var methodName = 'sensors-find#transformResponse()';

  var returnValue;
  switch(result.Items.length) {
    case 0: {
      returnValue = {};

      break;
    }
    case 1: {
      var item = result.Items[0];
      returnValue = deepcopy(item.sensor);
      returnValue.sensorId = item.sensorId;

      break;
    }
    default: {
      throw new ReferenceError('Unexpected number of results found for thingId ' + item.thingId);
    }
  }

  context.logger.info({ thingId: thingId, result: result, item: returnValue }, methodName);

  return returnValue;
}

function handleError(err, context) {
  var methodName = 'sensors-find#handleError()';

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

var find = function(thingId, systemId, context, AWS) {
  var dynamoDb = new dynamoDoc.DynamoDB(new AWS.DynamoDB());
  var query = Bluebird.promisify(dynamoDb.query, { context: dynamoDb });

  return Bluebird.resolve()
    .then(function() {
        return createRetrievalParams(thingId, systemId, context);
      })
    .then(query)
    .then(function(result) {
        return transformResponse(thingId, result, context);
      })
    .catch(function(err) {
        handleError(err, context);
      });
};

module.exports = find;