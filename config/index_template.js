'use strict';

var observationsName = 'DragonSense-observations';
var sensorsName = 'DragonSense-sensors';
var thingsName = 'DragonSense-things';

module.exports = {
  region: 'us-east-1',
  accountNumber: '',
  admin: {
    registry: 'arrow/registry'
  },
  iam: {
    lambda: {
      roleName: 'DragonSense-Lambda'
    },
    api: {
      roleName: 'DragonSense-ApiGateway'
    },
    iot: {
      roleName: 'DragonSense-IoT'
    }
  },
  lambda: {
    observations: {
      name: observationsName,
      handler: 'observations.handler'
    },
    sensors: {
      name: sensorsName,
      handler: 'sensors.handler'
    },
    things: {
      name: thingsName,
      handler: 'things.handler'
    }
  },
  dynamodb: {
    observations: {
      name: observationsName,
      observationHistoryIndex: 'observation-history-index'
    },
    sensors: {
      name: sensorsName,
      sensorIdentificationIndex: 'sensor-identification-index'
    }
  },
  iot: {
    policies: {
      DragonSenseThing: 'DragonSense'
    },
    topics: {
      sensors: 'DragonSenseSensors',
      observations: 'DragonSenseObservations'
    }
  }
};
