module.exports = {
  "id": "/entity/sensor",
  "definitions": {
    "sensorId": {
      "type": "string",
      "pattern": "^[a-fA-F0-9-]+$",
      "minLength": 10
    },
    "systemId": {
      "type": "string"
    },
    "base": {
      "type": "object",
      "properties": {
        "manufacturerName": {
          "type": "string"
        },
        "firmwareVersion": {
          "type": "string"
        },
        "hardwareVersion": {
          "type": "string"
        },
        "softwareVersion": {
          "type": "string"
        },
        "systemId": {
          "$ref": "#/definitions/systemId"
        },
        "timestamp": {
          "type": "integer"
        }
      },
      "required": [
        "systemId", "firmwareVersion", "hardwareVersion", "manufacturerName"
      ],
      "additionalProperties": false
    }
  },
  "sensor": {
    "allOf": [
      {
        "sensorId": {
          "$ref": "#/definitions/sensorId"
        }
      },
      {
        "$ref": "#/definitions/base"
      }
    ],
    "additionalProperties": false
  },
  "sensors": {
    "type": "array",
    "items": {
      "$ref": "#/definitions/sensor"
    },
    "additionalProperties": false
  }
};