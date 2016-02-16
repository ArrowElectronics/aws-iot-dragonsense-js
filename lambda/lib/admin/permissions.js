'use strict';

var config = require('dragonsense-config');

function createIotArn(resource) {
  return ['arn:aws:iot', config.region, config.accountNumber, 'rule/' + resource].join(':');
}

module.exports = {
  observations: {
    FunctionName: config.lambda.observations.name,
    Action: 'lambda:InvokeFunction',
    Principal: 'iot.amazonaws.com',
    StatementId: 'observationsStatement',
    SourceArn: createIotArn(config.iot.topics.observations)
  },
  sensors: {
    FunctionName: config.lambda.sensors.name,
    Action: 'lambda:InvokeFunction',
    Principal: 'iot.amazonaws.com',
    StatementId: 'sensorsStatement',
    SourceArn: createIotArn(config.iot.topics.sensors)
  }
};