module.exports = {
  "id": "/entity/thing",
  "definitions": {
    "thingId": {
      "type": "string",
      "minLength": 1,
      "maxLength": 255,
      "pattern": "^[a-zA-Z0-9_-]+$"
    },
    "attribute": {
      "type": "object",
      "patternProperties": {
        "^[a-zA-Z0-9_-]+$": {}
      },
      "additionalProperties": false
    }
  }
};