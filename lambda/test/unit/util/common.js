'use strict';

var findProperty = function(definition, property) {
  if (!definition || !Array.isArray(definition)) {
    throw new TypeError('Definition must be an array of objects');
  }

  if (!property) {
    throw new TypeError('Property must be defined');
  }

  var returnValue;

  Array.apply(null, {length: definition.length}).map(Number.call, Number).some(function(index) {

    var element = definition[index];
    if (typeof element === 'object') {
      Object.keys(element).some(function(candidate) {
        if (candidate === property) {
          returnValue = element[candidate];
        }

        return returnValue;
      });
    }

    return returnValue;
  });

  if (!returnValue) {
    throw new TypeError(property + ' is not defined as a key in the schema');
  }

  return returnValue;
};

module.exports = {
  findProperty: findProperty
};
