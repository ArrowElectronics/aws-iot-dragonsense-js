'use strict';

function AccessDeniedError(message) {
  this.name = 'AccessDeniedError';

  var detail = message || 'Please check the permissions needed to perform this function.';
  this.message = this.name + ':  ' + detail;

  Error.captureStackTrace(this, AccessDeniedError);
}
AccessDeniedError.prototype = Object.create(Error.prototype);
AccessDeniedError.prototype.constructor = AccessDeniedError;

function MaxAttemptsExceededError(message) {
  this.name = 'MaxAttemptsExceededError';

  var detail = message || 'INTERNAL ERROR:  The maximum number of attempts have been exceeded.';
  this.message = [this.name, detail].join(':  ');

  Error.captureStackTrace(this, MaxAttemptsExceededError);
}
MaxAttemptsExceededError.prototype = Object.create(Error.prototype);
MaxAttemptsExceededError.prototype.constructor = MaxAttemptsExceededError;

function ResourceAlreadyExistsError(message) {
  this.name = 'ResourceAlreadyExistsError';

  var detail = message || 'The resource already exists.';
  this.message = this.name + ':  ' + detail;

  Error.captureStackTrace(this, ResourceAlreadyExistsError);
}
ResourceAlreadyExistsError.prototype = Object.create(Error.prototype);
ResourceAlreadyExistsError.prototype.constructor = ResourceAlreadyExistsError;

function ResourceNotFoundError(message) {
  this.name = 'ResourceNotFoundError';

  var detail = message || 'The resource was not found.';
  this.message = this.name + ':  ' + detail;

  Error.captureStackTrace(this, ResourceNotFoundError);
}
ResourceNotFoundError.prototype = Object.create(Error.prototype);
ResourceNotFoundError.prototype.constructor = ResourceNotFoundError;

function UnknownError(code, message) {
  this.name = 'UnknownError';
  this.code = code;

  var detail = message || 'An unknown error occurred, please consult the logs for more information.';
  this.message = this.name + ':  ' + detail;

  Error.captureStackTrace(this, UnknownError);
}
UnknownError.prototype = Object.create(Error.prototype);
UnknownError.prototype.constructor = UnknownError;

module.exports = {
  AccessDeniedError: AccessDeniedError,
  MaxAttemptsExceededError: MaxAttemptsExceededError,
  ResourceAlreadyExistsError: ResourceAlreadyExistsError,
  ResourceNotFoundError: ResourceNotFoundError,
  UnknownError: UnknownError
};