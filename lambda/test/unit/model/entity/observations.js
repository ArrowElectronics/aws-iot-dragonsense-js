var Promise = require('bluebird');

var chai = require('chai'),
    chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);
chai.should();

var Validator = require('jsonschema').Validator;

var config = require('./../../config');

var audioEvent = require('model/entity/audioEvent');

var eventSchema = {
  "id": "/eventSchema",
  "allOf": [
    {
      "$ref": "/entity/audioEvent#/definitions/event"
    }
  ]
};

var eventsSchema = {
  "id": "/eventsSchema",
  "allOf": [
    {
      "$ref": "/entity/audioEvent#/definitions/events"
    }
  ]
};

describe('the audioEvent entity model', function() {
  var context = config.getContext();
  var validator;

  beforeEach(function() {
    validator = new Validator();
    validator.addSchema(audioEvent);
  });

  it('must validate a valid volume value', function(done) {
    var testName = this.test.fullTitle();

    context.logger.info(testName);

    var event = {
      volume: 'increase',
      timestamp: Math.floor(new Date() / 100)
    };

    Promise.try(function() {
          var result = validator.validate(event, eventSchema);

          context.logger.info({ validationResult: result }, testName);

          return result.valid;
        })
      .should.eventually.be.fulfilled
      .and.equal(true)
      .and.notify(done);
  });

  it('must not validate an invalid volume value', function(done) {
    var testName = this.test.fullTitle();

    context.logger.info(testName);

    var event = {
      volume: 'invalidValue',
      timestamp: Math.floor(new Date() / 100)
    };

    Promise.try(function() {
          var result = validator.validate(event, eventSchema);

          context.logger.info({ validationResult: result }, testName);

          return result.valid;
        })
      .should.eventually.be.equal(false)
      .and.notify(done);
  });

  it('must not validate an event with an additional property', function(done) {
    var testName = this.test.fullTitle();

    context.logger.info(testName);

    var event = {
      volume: 'increase',
      timestamp: Math.floor(new Date() / 100),
      additionalProperty: 'value'
    };

    Promise.try(function() {
          var result = validator.validate(event, eventSchema);

          context.logger.info({ validationResult: result }, testName);

          return result.valid;
        })
      .should.eventually.be.equal(false)
      .and.notify(done)
  });

  it('must validate an array of events', function(done) {
    var testName = this.test.fullTitle();

    context.logger.info(testName);

    var events = [
      {
        volume: 'increase',
        timestamp: Math.floor(new Date() / 100)
      },
      {
        volume: 'decrease',
        timestamp: Math.floor(new Date() / 100)
      },
      {
        volume: 'decrease',
        timestamp: Math.floor(new Date() / 100)
      }
    ];

    Promise.try(function() {
          var result = validator.validate(events, eventsSchema);

          context.logger.info({ validationResult: result }, testName);

          return result.valid;
        })
      .should.eventually.be.equal(true)
      .and.notify(done);
  });

  it('must validate an empty array of events', function(done) {
    var testName = this.test.fullTitle();

    context.logger.info(testName);

    var events = [];

    Promise.try(function() {
          var result = validator.validate(events, eventsSchema);

          context.logger.info({ validationResult: result }, testName);

          return result.valid;
        })
      .should.eventually.be.equal(true)
      .and.notify(done);
  });
});
