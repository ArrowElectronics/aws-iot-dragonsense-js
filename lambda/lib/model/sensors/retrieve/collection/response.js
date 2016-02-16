var sensor = require('./../../entity/sensor');

module.exports = {
  "entities": {
    "sensor": sensor
  },
  "schema": {
    "id": "sensor-retrieve-collection-response",
    "$schema": "http://json-schema.org/draft-04/schema#",
    "allOf": [
      {
        "$ref": "/entity/sensor#/definitions/sensors"
      }
    ]
  }
};