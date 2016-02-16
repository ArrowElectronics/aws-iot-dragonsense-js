'use strict';

var observation = require('./../../entity/observation');
var sensor = require('./../../entity/sensor');
var thing = require('./../../entity/thing');

module.exports = {
  "entities": {
    "thing": thing,
    "sensor": sensor,
    "observation": observation
  },
  "schema": {
    "id": "sensor-retrieve-single-request",
    "$schema": "http://json-schema.org/draft-04/schema#",
    "type": "object",
    "properties": {
      "thingId": {
        "$ref": "/entity/thing#/definitions/thingId"
      },
      "sensorId": {
        "$ref": "/entity/sensor#/definitions/sensorId"
      },
      "systemId": {
        "$ref": "/entity/sensor#/definitions/systemId"
      },
      "observationId": {
        "$ref": "/entity/observation#/definitions/observationId"
      },
      "limit": {
        "$ref": "/entity/observation#/definitions/limit"
      }
    },
    "required": [
      "thingId"
    ],
    "additionalProperties": false
  }
};