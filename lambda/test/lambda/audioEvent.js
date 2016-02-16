'use strict';

var Bluebird = require('Bluebird'),
    chai = require('chai'),
    chaiAsPromised = require('chai-as-promised'),
    uuid = require('uuid');

chai.use(chaiAsPromised);
chai.should();

var audioEvent = require('resources/audioEvent'),
    config = require('./config'),
    LoggerFactory = require('util/log').LoggerFactory;

/* The following tests assume that the Lambda environment has been properly configured and that a thing with the
 * name of 'lambdaTest' has been created using the administrative function.  If the 'lambdaTest' thing does not
 * exist, the tests will not successfully complete.
 */
describe('The audioEvent lambda function must be able to', function () {
  var context = config.getContext();

  it('create and retrieve an audioEvent', function(done) {
    var subject = Bluebird.promisify(audioEvent);

    var request = {
      action: 'create',
      message: {
        volume: 'increase',
        timestamp: Math.floor(new Date().getTime() / 1000)
      }
    };

    subject(request, context)
      .should.eventually.be.fulfilled
      .and.notify(done);
  });
});