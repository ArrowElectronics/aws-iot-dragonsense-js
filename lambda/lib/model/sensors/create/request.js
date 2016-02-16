var sensor = require('./../../entity/sensor');
var thing = require('./../../entity/thing');

module.exports = {
  "entities": {
    "thing": thing,
    "sensor": sensor
  },
  "schema": {
    "id": "sensor-create-request",
    "$schema": "http://json-schema.org/draft-04/schema#",
    "type": "object",
    "properties": {
      "thingId": {
        "$ref": "/entity/thing#/definitions/thingId"
      },
      "sensor": {
        "$ref": "/entity/sensor#/definitions/base"
      }
    },
    "required": [
      "thingId", "sensor"
    ],
    "additionalProperties": false
  }
};