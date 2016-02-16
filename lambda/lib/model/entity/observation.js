module.exports = {
  "id": "/entity/observation",
  "$schema": "http://json-schema.org/draft-04/schema#",
  "definitions": {
    "observationId": {
      "type": "string",
      "pattern": "^[a-fA-F0-9-]+$",
      "minLength": 10
    },
    "awsIssue": {
      "type": "object",
      "properties": {
        "objTemperature": {
          "type": "number"
        },
        "ambTemperature": {
          "type": "number"
        },
        "barometricPressure": {
          "type": "number"
        },
        "humidity": {
          "type": "number"
        },
        "humidityTemp": {
          "type": "number"
        },
        "luxometer": {
          "type": "number"
        },
        "accelerometerX": {
          "type": "number"
        },
        "accelerometerY": {
          "type": "number"
        },
        "accelerometerZ": {
          "type": "number"
        },
        "gyroscopeX": {
          "type": "number"
        },
        "gyroscopeY": {
          "type": "number"
        },
        "gyroscopeZ": {
          "type": "number"
        },
        "magnetometerX": {
          "type": "number"
        },
        "magnetometerY": {
          "type": "number"
        },
        "magnetometerZ": {
          "type": "number"
        },
        "timestamp": {
          "type": "integer"
        },
        "lastSend": {
          "type": "integer"
        }
      },
      "required": [
        "objTemperature", "ambTemperature", "luxometer", "timestamp", "lastSend"
      ],
      "additionalProperties": false
    },
    "base": {
      "type": "object",
      "properties": {
        "objTemperature": {
          "type": "number"
        },
        "ambTemperature": {
          "type": "number"
        },
        "barometricPressure": {
          "type": "number"
        },
        "humidity": {
          "type": "number"
        },
        "humidityTemp": {
          "type": "number"
        },
        "luxometer": {
          "type": "number"
        },
        "accelerometer": {
          "$ref": "#/definitions/sample"
        },
        "gyroscope": {
          "$ref": "#/definitions/sample"
        },
        "magnetometer": {
          "$ref": "#/definitions/sample"
        },
        "timestamp": {
          "type": "integer"
        },
        "lastSend": {
          "type": "integer"
        }
      },
      "required": [
        "objTemperature", "ambTemperature", "luxometer", "timestamp", "lastSend"
      ],
      "additionalProperties": false
    },
    "observation": {
      "allOf": [
        {
          "observationId": {
            "$ref": "#/definitions/observationId"
          }
        },
        {
          "$ref": "#/definitions/base"
        }
      ],
      "additionalProperties": false
    },
    "observations": {
      "type": "array",
      "items": {
        "$ref": "#/definitions/observation"
      },
      "additionalProperties": false
    },
    "limit": {
      "type": "integer"
    },
    "sample": {
      "type": "array",
      "maxItems": 3,
      "minItems": 3,
      "items": {
        "type": "number"
      },
      "additionalProperties": false
    }
  }
};