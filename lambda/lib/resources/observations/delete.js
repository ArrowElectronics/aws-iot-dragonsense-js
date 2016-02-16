'use strict';

var Bluebird = require('bluebird');

var config = require('dragonsense-config');

var errors = require('./../../error'),
    MaxAttemptsExceededError = errors.MaxAttemptsExceededError;

var getObservations = require('./collection');

var MAX_ATTEMPTS = 5;
var MAX_ITEMS = 25;

function createDeleteParams(observations, context) {
  var methodName = 'observations-delete#createDeleteParams()';

  var returnValue = [];
  for (var i = 0; i < observations.length; i++) {
    var observation = observations[i];
    returnValue.push(
      {
        DeleteRequest: {
          Key: {
            sensorId: {
              S: observation.sensorId
            },
            observationId: {
              S: observation.observationId
            }
          }
        }
      }
    );
  }

  context.logger.info( { count: returnValue.length }, methodName);

  return returnValue;
}

function createPartition(partitionRequests, index) {
  var requestItems = {};
  requestItems[config.dynamodb.observations.name] = partitionRequests;

  return {
    label: String(index),
    partition: {
      RequestItems: requestItems
    }
  };
}

function partitionJob(items, context, AWS) {
  var methodName = 'observations-delete#partitionJob';

  var returnValue = [];

  var partitionRequests;
  var totalPartitions = Math.floor(items.length / MAX_ITEMS);

  for (var i = 0; i < totalPartitions; i++) {
    partitionRequests = [];
    for (var j = 0; j < MAX_ITEMS; j++) {
      partitionRequests.push(items[i * MAX_ITEMS + j]);
    }

    returnValue.push(partitionRequests);
  }

  if (items.length % (totalPartitions * MAX_ITEMS) != 0) {
    partitionRequests = [];
    for (var k = (totalPartitions * MAX_ITEMS); k < items.length; k++) {
      partitionRequests.push(items[k]);
    }

    returnValue.push(partitionRequests);
  }

  context.logger.info( { jobItems: items.length, partitionCount: returnValue.length }, methodName);

  return returnValue;
}

function batchDeleteItems(params, attempts, context, dynamoDb) {
  var methodName = 'observations-delete#batchDeleteItems';

  var awsBatchWriteItem = Bluebird.promisify(dynamoDb.batchWriteItem, { context: dynamoDb });

  attempts = attempts || 0;

  return awsBatchWriteItem(params.partition)
    .then(function(result) {
        if (Object.keys(result.UnprocessedItems).length === 0) {
          context.logger.info(methodName + ':  Successfully deleted all observations for partition ' + params.label);
        } else {
          context.logger.info(
            { partition: params.label, UnprocessedItems: result.UnprocessedItems.length }, methodName);

          var retryParams = {
            label: params.label,
            partition: {
              RequestItems: result.UnprocessedItems
            }
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

                context.logger.info(methodName + ':  Provisioned throughput exceeded.  Beginning attempt ' + attempts);
              })
            .then(function() {
                return Bluebird.delay(Math.pow(2, attempts) * 250);
              })
            .then(function() {
                return batchDeleteItems(params, attempts, context, dynamoDb);
              })
            .catch(function(err) {
                throw err;
              });
        } else if (attempts >= MAX_ATTEMPTS) {
          var maxAttemptsMessage = methodName + ':  Maximum number of attempts of ' + MAX_ATTEMPTS + ' exceeded.';

          context.logger.warn(maxAttemptsMessage);

          throw new MaxAttemptsExceededError(maxAttemptsMessage);
        }

        context.logger.warn({ error: err }, methodName);

        throw err;
      });
}

var deleteItems = function(message, context, AWS) {
  var methodName = 'observations-delete#deleteItems()';

  context.logger.info('Starting ' + methodName);

  var dynamoDb = new AWS.DynamoDB();

  var thingId = message.thingId;
  var sensorId = message.sensorId;

  return Bluebird.try(function() {
        var params = {
          thingId: thingId,
          sensorId: sensorId
        };

        return getObservations(params, context, AWS);
      })
    .then(function(observations) {
        if (Array.isArray(observations) && observations.length > 0) {
          return Bluebird.mapSeries(observations, function(observation) {
                return {
                  sensorId: sensorId,
                  observationId: observation.observationId
                };
              })
            .then(function(sensorObservationParams) {
                return createDeleteParams(sensorObservationParams, context);
              })
            .then(function(jobItems) {
                return partitionJob(jobItems, context, AWS);
              })
            .mapSeries(function(partitionRequest, index) {
                return createPartition(partitionRequest, index);
              })
            .each(function(partition) {
                return batchDeleteItems(partition, 0, context, dynamoDb);
              })
            .catch(function(err) {
                throw err;
              });
        } else {
          context.logger.info(methodName + ':  No observations to delete');
        }
      })
    .catch(function(err) {
        throw err;
      });
};

module.exports = deleteItems;