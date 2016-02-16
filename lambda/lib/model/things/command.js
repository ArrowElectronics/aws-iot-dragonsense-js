module.exports = {
  "schema": {
    "id": "/command/thing",
    "$schema": "http://json-schema.org/draft-04/schema#",
    "type": "object",
    "properties": {
      "action": {
        "enum": [ "retrieve", "update" ]
      },
      "message": {
        "type": "object"
      }
    },
    "required": [ "action", "message" ]
  }
};