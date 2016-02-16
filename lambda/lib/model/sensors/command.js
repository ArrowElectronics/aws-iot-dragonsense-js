module.exports = {
  "schema": {
    "id": "/command/sensors",
    "$schema": "http://json-schema.org/draft-04/schema#",
    "type": "object",
    "properties": {
      "action": {
        "enum": [ "create", "retrieve", "delete" ]
      },
      "message": {
        "type": "object"
      }
    },
    "required": [ "action", "message" ],
    "additionalProperties": false
  }
};