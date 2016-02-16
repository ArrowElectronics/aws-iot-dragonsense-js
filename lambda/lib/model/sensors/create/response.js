var sensor = require('./../../entity/sensor');

module.exports = {
  "entities": {
    "sensor": sensor
  },
  "schema": {
    "id": "sensor-create-response",
    "$schema": "http://json-schema.org/draft-04/schema#",
    "allOf": [
      {
        "$ref": "/entity/sensor#/definition/sensor"
      }
    ]
  }
};