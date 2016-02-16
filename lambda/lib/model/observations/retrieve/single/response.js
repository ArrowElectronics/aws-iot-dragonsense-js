var observation = require('./../../entity/observation');

module.exports = {
  "entities": {
    "observation": observation
  },
  "schema": {
    "id": "observation-retrieve-single-response",
    "$schema": "http://json-schema.org/draft-04/schema#",
    "allOf": [
      {
        "$ref": "/entity/observation#/definitions/observation"
      }
    ]
  }
};