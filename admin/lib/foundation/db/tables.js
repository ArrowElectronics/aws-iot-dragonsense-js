'use strict';

var config = require('dragonsense-config');

var STRING = 'S';
var NUMBER = 'N';
var BINARY = 'B';

var HASH_KEY_TYPE = 'HASH';
var RANGE_KEY_TYPE = 'RANGE';

var PROJECTION_ALL = 'ALL';
var PROJECTION_KEYS_ONLY = 'KEYS_ONLY';

var defaultThroughput = {
  ReadCapacityUnits: 5,
  WriteCapacityUnits: 5
};

module.exports = [
  {
    TableName: config.dynamodb.sensors.name,
    AttributeDefinitions: [
      {
        AttributeName: 'thingId',
        AttributeType: STRING
      },
      {
        AttributeName: 'sensorId',
        AttributeType: STRING
      },
      {
        AttributeName: 'systemId',
        AttributeType: STRING
      }
    ],
    KeySchema: [
      {
        AttributeName: 'thingId',
        KeyType: HASH_KEY_TYPE
      },
      {
        AttributeName: 'sensorId',
        KeyType: RANGE_KEY_TYPE
      }
    ],
    LocalSecondaryIndexes: [
      {
        IndexName: config.dynamodb.sensors.sensorIdentificationIndex,
        KeySchema: [
          {
            AttributeName: 'thingId',
            KeyType: HASH_KEY_TYPE
          },
          {
            AttributeName: 'systemId',
            KeyType: RANGE_KEY_TYPE
          }
        ],
        Projection: {
          ProjectionType: PROJECTION_ALL
        }
      }
    ],
    ProvisionedThroughput: defaultThroughput
  },
  {
    TableName: config.dynamodb.observations.name,
    AttributeDefinitions: [
      {
        AttributeName: 'sensorId',
        AttributeType: STRING
      },
      {
        AttributeName: 'observationId',
        AttributeType: STRING
      },
      {
        AttributeName: 'timestamp',
        AttributeType: NUMBER
      }
    ],
    KeySchema: [
      {
        AttributeName: 'sensorId',
        KeyType: HASH_KEY_TYPE
      },
      {
        AttributeName: 'observationId',
        KeyType: RANGE_KEY_TYPE
      }
    ],
    LocalSecondaryIndexes: [
      {
        IndexName: config.dynamodb.observations.observationHistoryIndex,
        KeySchema: [
          {
            AttributeName: 'sensorId',
            KeyType: HASH_KEY_TYPE
          },
          {
            AttributeName: 'timestamp',
            KeyType: RANGE_KEY_TYPE
          }
        ],
        Projection: {
          ProjectionType: PROJECTION_ALL
        }
      }
    ],
    ProvisionedThroughput: defaultThroughput
  }
];