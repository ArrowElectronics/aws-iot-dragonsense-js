'use strict';

function SimpleError(condition, err) {
  this.name = 'SimpleError';

  if (!condition) {
    throw new TypeError('Condition must be defined.');
  }
  this.condition = condition;

  this.err = err;
  this.message = err.message;
}
SimpleError.prototype = Object.create(Error.prototype);
SimpleError.prototype.constructor = SimpleError;

module.exports = SimpleError;