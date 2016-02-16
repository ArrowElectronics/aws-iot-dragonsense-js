'use strict';

var Bluebird = require('bluebird');

var config = require('dragonsense-config');

var errors = require('./../../error'),
    AccessDeniedError = errors.AccessDeniedError,
    MaxAttemptsExceededError = errors.MaxAttemptsExceededError,
    UnknownError = errors.UnknownError;

var ValidationManager = require('./../../model/validationmanager').ValidationManager;
var requestSchema = require('./../../model/sensors/delete/request');

var getSensors = require('./collection'),
    deleteObservations = require('./../observations/delete');

var MAX_ATTEMPTS = 5;

function createDeleteParams(sensors, context) {
  var methodName = 'sensors-delete#createDeleteParams()';

  var deleteRequests = [];
  for (var i = 0; i < sensors.length; i++) {
    var sensor = sensors[i];
    deleteRequests.push(
      {
        DeleteRequest: {
          Key: {
            thingId: {
              S: sensor.thingId
            },
            sensorId: {
              S: sensor.sensorId
            }
          }
        }
      }
    );
  }

  var requestItems = {};
  requestItems[config.dynamodb.sensors.name] = deleteRequests;

  var returnValue = {
    RequestItems: requestItems
  };

  context.logger.info( { sensors: sensors, count: deleteRequests.length }, methodName);

  return returnValue;
}

function handleError(err, context) {
  var methodName = 'sensors-delete#handleError()';

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

function batchDeleteItems(params, attempts, context, dynamoDb) {
  var awsBatchWriteItem = Bluebird.promisify(dynamoDb.batchWriteItem, { context: dynamoDb });

  attempts = attempts || 0;

  return awsBatchWriteItem(params)
    .then(function(result) {
        if (Object.keys(result.UnprocessedItems).length === 0) {
          context.logger.info('Successfully deleted all sensors');
        } else {
          context.logger.info({ UnprocessedItems: result.UnprocessedItems }, 'Sensor UnprocessedItems remaining');

          var retryParams = {
            RequestItems: result.UnprocessedItems
          };

          return Bluebird.try(function() {
                return batchDeleteItems(retryParams, attempts, context, dynamoDb);
              })
            .catch(function(err) {
                throw err;
              });
        }
      })
    .catch(function(err) {
        if (err.errorCode === 'ProvisionedThroughputExceededException' && attempts < MAX_ATTEMPTS) {
          return Bluebird.resolve()
            .then(function() {
                ++attempts;

                console.logger.info('Provisioned throughput exceeded.  Beginning attempt ' + attempts);
              })
            .then(function() {
                return Bluebird.delay(Math.pow(2, attempts) * 500);
              })
            .then(function() {
                return batchDeleteItems(result.UnprocessedItems, attempts, context, dynamoDb);
              })
            .catch(function(err) {
                throw err;
              });
        } else if (attempts >= MAX_ATTEMPTS) {
          var maxAttemptsMessage = 'Maximum number of attempts of ' + MAX_ATTEMPTS + ' exceeded.';

          context.logger.warn(maxAttemptsMessage);

          throw new MaxAttemptsExceededError(maxAttemptsMessage);
        }

        throw err;
      });
}

var deleteItems = function(message, context, AWS) {
  var methodName = 'sensors-delete#deleteItems()';

  return new ValidationManager(context).validate(message, requestSchema)
    .then(function() {
        var thingId = message.thingId;

        context.logger.info('Removing sensors for thing with identifier of ' + thingId);

        return Bluebird.try(function() {
              var params = {
                thingId: thingId
              };

              return getSensors(params, context, AWS);
            })
          .then(function(sensors) {
              if (Array.isArray(sensors) && sensors.length > 0) {
                return Bluebird.mapSeries(sensors, function(sensor) {
                      return {
                        thingId: thingId,
                        sensorId: sensor.sensorId
                      };
                    })
                  .each(function(thingSensorParams) {
                      return deleteObservations(thingSensorParams, context, AWS);
                    })
                  .all()
                  .then(function(thingSensorParams) {
                      return createDeleteParams(thingSensorParams, context);
                    })
                  .then(function(params) {
                      return batchDeleteItems(params, 0, context, new AWS.DynamoDB());
                    })
                  .catch(function(err) {
                      throw err;
                    });
              } else {
                context.logger.info(methodName + ':  No sensors found to delete');
              }
            })
          .catch(function(err) {
              throw err;
            });
      })
    .catch(function(err) {
        handleError(err, context);
      });
};

module.exports = deleteItems;