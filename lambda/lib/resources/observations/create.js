'use strict';

var Bluebird = require('bluebird'),
    dynamoDoc = require('dynamodb-doc'),
    deepcopy = require('deepcopy'),
    uuid = require('uuid');

var config = require('dragonsense-config');

var errors = require('./../../error'),
    AccessDeniedError = errors.AccessDeniedError,
    ResourceNotFoundError = errors.ResourceNotFoundError,
    UnknownError = errors.UnknownError;

var ValidationManager = require('./../../model/validationmanager').ValidationManager;
var requestSchema = require('./../../model/observations/create/request');

var findSensor = require('./../sensors/find');

function awsIssueTransform(message, context) {
  var methodName = 'observations-create#awsIssueTransform()';

  var returnValue = {
    thingId: message.thingId,
    sensorId: message.sensorId
  };
  var msgObs = message.observation;

  var observation = {
    objTemperature: msgObs.objTemperature,
    ambTemperature: msgObs.ambTemperature,
    luxometer: msgObs.luxometer,
    timestamp: msgObs.timestamp,
    lastSend: msgObs.lastSend
  };

  if (msgObs.accelerometerX && msgObs.accelerometerY && msgObs.accelerometerZ ) {
    observation.accelerometer = [ msgObs.accelerometerX, msgObs.accelerometerY, msgObs.accelerometerZ ];
  }

  if (msgObs.gyroscopeX && msgObs.gyroscopeY && msgObs.gyroscopeZ) {
    observation.gyroscope = [ msgObs.gyroscopeX, msgObs.gyroscopeY, msgObs.gyroscopeZ ];
  }

  if (msgObs.magnetometerX && msgObs.magnetometerY && msgObs.magnetometerZ) {
    observation.magnetometer = [ msgObs.magnetometerX, msgObs.magnetometerY, msgObs.magnetometerZ ];
  }

  returnValue.observation = observation;

  context.logger.info( { message: message, transformedMessage: returnValue }, methodName);

  return returnValue;
}

function createItemParams(message, context) {
  var methodName = 'observations-create#createItemParams()';

  var returnValue = {
    TableName:  config.dynamodb.observations.name,
    Item: {
      thingId: message.thingId,
      sensorId: message.sensorId,
      observationId: uuid.v4(),
      timestamp: message.observation.timestamp,
      observation: JSON.stringify(message.observation)
    }
  };

  context.logger.info( { message: message, params: returnValue }, methodName);

  return returnValue;
}

function handleError(err, context) {
  var methodName = 'observations-create#handleError()';

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
  var methodName = 'observations-create#storeItem()';

  var dynamoDb = dynamoDoc.DynamoDB(new AWS.DynamoDB());

  var putItem = Bluebird.promisify(dynamoDb.putItem, { context: dynamoDb });

  var thingId;
  var systemId;
  var observationId;
  var returnValue;

  return new ValidationManager(context).validate(message, requestSchema)
    .then(function() {
        thingId = message.thingId;
        systemId = message.systemId;

        return findSensor(thingId, systemId, context, AWS);
      })
    .then(function(item) {
        if (!item) {
          throw new ResourceNotFoundError('Thing with identifier of ' + thingId +
            ' has does not have an associated sensor with identifier of ' + systemId);
        } else {
          context.logger.info('Creating observation for thing with identifier of ' + thingId +
            ' and sensor with identifier of ' + systemId);

          return Bluebird.try(function() {
                var resourceMessage = deepcopy(message);
                delete resourceMessage.systemId;
                resourceMessage.sensorId = item.sensorId;

                return resourceMessage;
              })
            .then(function(resourceMessage) {
                var transformedMessage = awsIssueTransform(resourceMessage, context);

                returnValue = deepcopy(transformedMessage.observation);

                return transformedMessage;
              })
            .then(function(transformedMessage) {
                var params = createItemParams(transformedMessage, context);

                observationId = params.Item.observationId;

                return params;
              })
            .then(putItem)
            .then(function() {
                returnValue.observationId = observationId;

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