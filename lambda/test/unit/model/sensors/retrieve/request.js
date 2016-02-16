var chai = require('chai'),
    chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);
chai.should();

var ValidationManager = require('model/validationmanager').ValidationManager;

var subjectSchema = require('model/led/retrieve/request');

var config = require('./../../../config');

describe('the led retrieve request model', function() {
  var context = config.getContext();
  var validationManager;

  beforeEach(
    function () {
      validationManager = new ValidationManager(context);
    }
  );

  it('must validate a valid request', function(done) {
    var testName = this.test.fullTitle();

    context.logger.info(testName);

    var thing = {
      thingId: 'validLedRetrieveRequest'
    };

    validationManager.validate(thing, subjectSchema)
      .catch(function(ex) {
          context.logger.error({ error: ex }, testName);

          throw ex;
        })
      .should.eventually.be.fulfilled
      .and.notify(done);
  });

  it('must not validate an empty request', function(done) {
    var testName = this.test.fullTitle();

    context.logger.info(testName);

    var message = {};

    validationManager.validate(message, subjectSchema)
      .catch(function(ex) {
          context.logger.error({ error: ex }, testName);

          throw ex;
        })
      .should.eventually.be.rejectedWith(/^InvalidEntityError/)
      .and.notify(done);
  });

  it('must not validate a request with additional properties', function(done) {
    var testName = this.test.fullTitle();

    context.logger.info(testName);

    var message = {
      thingId: 'validThingId',
      additionalProperty: 'value'
    };

    validationManager.validate(message, subjectSchema)
      .catch(function(ex) {
        context.logger.error({ error: ex }, testName);

        throw ex;
      })
      .should.eventually.be.rejectedWith(/^InvalidEntityError/)
      .and.notify(done);
  })
});
