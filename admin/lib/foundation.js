'use strict';

var program = require('commander'),
    Bluebird = require('bluebird');

var db = require('./foundation/db'),
    iam = require('./foundation/iam'),
    iot = require('./foundation/iot'),
    things = require('./foundation/things');

function manage(action) {
  // IAM must be configured before IoT as the IoT logging options requires the DragonSense-IoT role ARN
  Bluebird.try(function() {
        return things(action);
      })
    .then(function() {
        return iam(action);
      })
    .then(function() {
        return iot(action);
      })
    .then(function() {
        return db(action);
      })
    .catch(function(err) {
        console.error('ERROR:');
        console.error('  Condition:  ' + err.condition + ', Detail:  ' + err.message);
        console.error(err);
      });
}

program
  .version('0.1.0');

program
  .command('create')
  .description('Create the policies for the DragonSense example')
  .action(function() {
      manage('create');
    });

program
  .command('delete')
  .description('Delete the policies for the DragonSense example')
  .action(function() {
      manage('delete');
    });

program.parse(process.argv);

