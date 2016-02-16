'use strict';

var Bluebird = require('bluebird'),
    dynamoDoc = require('dynamodb-doc'),
    deepcopy = require('deepcopy'),
    uuid = require('uuid');

var config = require('dragonsense-config');

var errors = require('./../../error'),
    AccessDeniedError = errors.AccessDeniedError,
    ResourceAlreadyExistsError = errors.ResourceAlreadyExistsError,
    UnknownError = errors.UnknownError;

var ValidationManager = require('./../../model/validationmanager').ValidationManager;
var requestSchema = require('./../../model/sensors/create/request');

var single = require('./../things/single');

var findSensor = require('./find');

function createItemParams(message, context) {
  var methodName = 'sensors-create#transformRequest()';

  var returnValue = {
    TableName:  config.dynamodb.sensors.name,
    Item: {
      thingId: message.thingId,
      sensorId: uuid.v4(),
      systemId: message.sensor.systemId,
      sensor: message.sensor
    }
  };

  context.logger.info( { message: message, params: returnValue }, methodName);

  return returnValue;
}

function handleError(err, context) {
  var methodName = 'sensors-create#handleError()';

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

var storeItem = function(message, context, AWS) {
  var methodName = 'sensors-create#storeItem()';

  var iot = new AWS.Iot();
  var dynamoDb = dynamoDoc.DynamoDB(new AWS.DynamoDB());

  var putItem = Bluebird.promisify(dynamoDb.putItem, { context: dynamoDb });

  var thingId;
  var sensorId;
  var systemId;

  return new ValidationManager(context).validate(message, requestSchema)
    .then(function() {
        thingId = message.thingId;
        systemId = message.sensor.systemId;

        var params = {
          thingId: thingId
        };

        // Ensure that the thing exists and is associated with a principal
        return single(params, context, iot);
      })
    .then(function() {
        return findSensor(thingId, systemId, context, AWS);
      })
    .then(function(item) {
        if (Object.keys(item).length > 0) {
          throw new ResourceAlreadyExistsError('Resource for thingId ' + thingId +
            ' already has sensor with identifier of ' + systemId);
        } else {
          return Bluebird.try(function() {
              var params = createItemParams(message, context);

              sensorId = params.Item.sensorId;

              return params;
            })
          .then(putItem)
          .then(function() {
              var returnValue = deepcopy(message.sensor);
              returnValue.sensorId = sensorId;

              return returnValue;
            })
          .catch(function(err) {
              throw err;
            });
        }
      })
    .catch(function(err) {
        handleError(err, context);
      });
};

module.exports = storeItem;