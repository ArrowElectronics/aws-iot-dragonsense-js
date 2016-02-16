'use strict';

var config = require('dragonsense-config');

function createLambdaArn(resource) {
  return [ 'arn:aws:lambda', config.region, config.accountNumber, 'function', resource ].join(':');
}

module.exports = {
  observations: {
    sql: "SELECT 'create' as action, " +
         "topic(2) as message.thingId, " +
         "topic(4) as message.systemId, " +
         "* as message.observation " +
         "FROM 'things/+/sensors/+/observations'",
    ruleDisabled: false,
    actions: [
      {
        lambda: {
          functionArn: createLambdaArn(config.lambda.observations.name)
        }
      }
    ]
  },
  sensors: {
    sql: "SELECT 'create' as action, topic(2) as message.thingId, * as message.sensor " +
    "FROM 'things/+/sensors'",
    ruleDisabled: false,
    actions: [
      {
        lambda: {
          functionArn: createLambdaArn(config.lambda.sensors.name)
        }
      }
    ]
  }
};
