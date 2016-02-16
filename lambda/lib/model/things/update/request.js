var thing = require('./../../entity/thing');

module.exports = {
  "entities": {
    "thing": thing
  },
  "schema": {

    "id": "things-update-request",
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
            "maxProperties": 3
          }
        ]
      }

    },
    "required": [
      "thingId",
      "attributes"
    ]
  }
};
