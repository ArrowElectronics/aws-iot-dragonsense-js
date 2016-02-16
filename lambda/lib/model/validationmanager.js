'use strict';

var Bluebird = require('bluebird'),
    Validator = require('jsonschema').Validator;

function InvalidEntityError(message) {
  this.name = 'InvalidEntityError';

  var detail = message || 'The entity is invalid.';
  this.message = this.name + ':  ' + detail;

  Error.captureStackTrace(this, InvalidEntityError);
}
InvalidEntityError.prototype = Object.create(Error.prototype);
InvalidEntityError.prototype.constructor = InvalidEntityError;

function InvalidConfigurationError(message) {
  this.name = 'InvalidConfigurationError';

  var detail = message || 'The configuration is invalid';
  this.message = this.name + ':  ' + detail;

  Error.captureStackTrace(this, InvalidConfigurationError);
}
InvalidConfigurationError.prototype = Object.create(Error.prototype);
InvalidConfigurationError.prototype.constructor = InvalidConfigurationError;

var configSchema = {
  "id": "schema-configuration",
  "$schema": "http://json-schema.org/draft-04/schema#",
  "type": "object",
  "properties": {
    "schema": {
      "type": "object"
    },
    "entities": {
      "type": "object"
    }
  },
  "required": [
    "schema"
  ]
};

function ValidationManager(context) {
  this.logger = context.logger;
  this.validator = new Validator();
}
ValidationManager.prototype._validateConfig = Bluebird.method(
  function(config) {
    var methodName = 'ValidationManager#_validateConfig()';

    var validator = new Validator();

    var result = validator.validate(config, configSchema);
    if (false === result.valid) {
      this.logger.info( { configValidationResult: result }, methodName);

      throw new InvalidConfigurationError();
    }
  }
);
ValidationManager.prototype.validate = Bluebird.method(
  function(entity, config, options) {
    var methodName = 'ValidationManager#validate()';

    this._validateConfig(config);

    var validator = new Validator();

    if (config.hasOwnProperty('entities')) {
      var entities = config.entities;
      Object.keys(entities).forEach(function (key) {
        validator.addSchema(entities[key]);
      });
    }

    var result = validator.validate(entity, config.schema, options);
    if (false === result.valid) {
      this.logger.info({ validationResult: result }, methodName);

      throw new InvalidEntityError();
    }
  }
);

module.exports = {
  errors: {
    InvalidEntityError: InvalidEntityError,
    InvalidConfigurationError: InvalidConfigurationError
  },

  ValidationManager: ValidationManager
};
