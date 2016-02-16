var thing = require('./../../entity/thing');
var sensor = require('./../../entity/sensor');

module.exports = {
  "entities": {
    "thing": thing,
    "sensor": sensor
  },
  "schema": {
    "id": "observation-retrieve-single-request",
    "$schema": "http://json-schema.org/draft-04/schema#",
    "type": "object",
    "properties": {
      "thingId": {
        "$ref": "/entity/thing#/definitions/thingId"
      },
      "sensorId": {
        "$ref": "/entity/sensor#/definitions/sensor"
      }
    },
    "required": [
      "thingId", "sensorId"
    ],
    "additionalProperties": false
  }
};