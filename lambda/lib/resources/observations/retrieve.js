'use strict';

var ValidationManager = require('./../../model/validationmanager').ValidationManager;

var schema = require('./../../model/observations/retrieve/request');

var processRequest = function(message, context, AWS) {
  return new ValidationManager(context).validate(message, schema)
    .then(function() {
        var retriever;

        if (message.hasOwnProperty('observationId')) {
          retriever = require('./single');
        } else {
          // Set the default limit before the collection is retrieved for a request.  This allows other functions
          // to not be encumbered with the setting of a limit.
          message.limit = message.limit || 10;

          retriever = require('./collection');
        }
        return retriever(message, context, AWS, true);
      })
    .catch(function(err) {
        throw err;
      });
};

// Export For Lambda Handler
module.exports = processRequest;
