var thing = require('./../../entity/thing');
var sensor = require('./../../entity/sensor');
var observation = require('./../../entity/observation');

module.exports = {
  "entities": {
    "thing": thing,
    "sensor": sensor,
    "observation": observation
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
      },
      "systemId": {
        "$ref": "/entity/sensor#/definitions/systemId"
      },
      "observation": {
        "$ref": "/entity/observation#/definitions/awsIssue"
      }
    },
    "required": [
      "thingId", "observation"
    ],
    "additionalProperties": false
  }
};