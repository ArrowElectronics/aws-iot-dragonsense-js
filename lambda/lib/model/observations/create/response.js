var observation = require('./../../entity/observation');

module.exports = {
  "entities": {
    "observation": observation
  },
  "schema": {
    "id": "observation-create-response",
    "$schema": "http://json-schema.org/draft-04/schema#",
    "allOf": [
      {
        "$ref": "/entity/observations#/definitions/observation"
      }
    ]
  }
};