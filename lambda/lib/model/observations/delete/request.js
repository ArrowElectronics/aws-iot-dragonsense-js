'use strict';

var sensor = require('./../../entity/sensor');
var thing = require('./../../entity/thing');

module.exports = {
  "entities": {
    "thing": thing,
    "sensor": sensor
  },
  "schema": {
    "id": "observation-create-request",
    "$schema": "http://json-schema.org/draft-04/schema#",
    "type": "object",
    "properties": {
      "thingId": {
        "$ref": "/entity/thing#/definitions/thingId"
      },
      "sensorId": {
        "$ref": "/entity/sensor#/definitions/sensorId"
      }
    },
    "required": [
      "thingId", "sensorId"
    ],
    "additionalProperties": false
  }
};