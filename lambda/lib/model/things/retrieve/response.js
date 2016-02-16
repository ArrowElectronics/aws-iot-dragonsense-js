var thing = require("./../../entity/thing");

module.exports = {
  "entities": {
    "thing": thing
  },
  "schema": {
    "id": "thing-retrieve-request",
    "$schema": "http://json-schema.org/draft-04/schema#",
    "type": "object",
    "properties": {
      "thingId": {
        "$ref": "/entity/thing#/definitions/thingId"
      },
      "attributes": {
        "allOf": [
          {
            "$ref": "/entity/thing#/definitions/attribute"
          },
          {
            "minProperties": 1,
            "maxProperties": 3
          }
        ]
      }
    },
    "required": [
      "thingId"
    ]
  }
};