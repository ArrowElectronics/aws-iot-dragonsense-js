'use strict';

var ValidationManager = require('./../../model/validationmanager').ValidationManager;

var schema = require('./../../model/sensors/retrieve/request');

var processRequest = function(message, context, AWS) {
  return new ValidationManager(context).validate(message, schema)
    .then(function() {
        var retriever;

        if (message.hasOwnProperty('sensorId')) {
          retriever = require('./single');
        } else {
          retriever = require('./collection');
        }
        return retriever(message, context, AWS);
      })
    .catch(function(err) {
        throw err;
      });
};

// Export For Lambda Handler
module.exports = processRequest;
