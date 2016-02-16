'use strict';

var ValidationManager = require('./../../model/validationmanager').ValidationManager;

var schema = require('./../../model/things/retrieve/request');

var processRequest = function(message, context, iot) {
  return new ValidationManager(context).validate(message, schema)
    .then(function() {
        var retriever;

        if (message.hasOwnProperty('thingId')) {
          retriever = require('./single');
        } else {
          retriever = require('./collection');
        }

        return retriever(message, context, iot);
      })
    .catch(function(err) {
        throw err;
      });
};

// Export For Lambda Handler
module.exports = processRequest;
