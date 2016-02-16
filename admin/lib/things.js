'use strict';

var fs = require('fs'),
    program = require('commander'),
    Bluebird = require('bluebird');

var things = require('./things/mgmt');

function manage(action, context) {
  Bluebird.try(function() {
        return things(action, context)
      });
}

program
  .version('0.1.0');

program
  .command('create <thingId>')
  .description('Create a thing and associate it with the DragonSense policy')
  .action(function(thingId, options) {
    var context = {
      thingId: thingId
    };

    manage('create', context);
  });

program
  .command('delete <thingId>')
  .description('Delete a thing and disassociate it with the DragonSense policy')
  .action(function(thingId, options) {
    var context = {
      thingId: thingId
    };

    manage('delete', context);
  });

program.parse(process.argv);

