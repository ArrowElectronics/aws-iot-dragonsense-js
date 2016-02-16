var chai = require('chai'),
    chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);
chai.should();

var ValidationManager = require('model/validationmanager').ValidationManager;

var subjectSchema = require('model/led/update/request');

var config = require('./../../../config');

describe('the led update request model', function() {
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

    var message = {
      thingId: 'validLedUpdateRequest',
      active: true
    };

    validationManager.validate(message, subjectSchema)
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
      active: true,
      additionalProperty: 'value'
    };

    validationManager.validate(message, subjectSchema)
      .catch(function(ex) {
          context.logger.error({ error: ex }, testName);

          throw ex;
        })
      .should.eventually.be.rejectedWith(/^InvalidEntityError/)
      .and.notify(done);
  });

  it('must not validate a request with no active property', function(done) {
    var testName = this.test.fullTitle();

    var message = {
      thingId: 'validThingIdWithNoActiveProperty'
    };

    validationManager.validate(message, subjectSchema)
      .catch(function(ex) {
          context.logger.error({ error: ex }, testName);

          throw ex;
        })
      .should.eventually.be.rejectedWith(/^InvalidEntityError/)
      .and.notify(done);
  });


  it('must not validate a request with no thingId property', function(done) {
    var testName = this.test.fullTitle();

    var message = {
      active: false
    };

    validationManager.validate(message, subjectSchema)
      .catch(function(ex) {
        context.logger.error({ error: ex }, testName);

        throw ex;
      })
      .should.eventually.be.rejectedWith(/^InvalidEntityError/)
      .and.notify(done);
  });

  it('must not validate a request with invalid active property', function(done) {
    var testName = this.test.fullTitle();

    var message = {
      thingId: 'validThingIdWithNoActiveProperty',
      active: 'test'
    };

    validationManager.validate(message, subjectSchema)
      .catch(function(ex) {
        context.logger.error({ error: ex }, testName);

        throw ex;
      })
      .should.eventually.be.rejectedWith(/^InvalidEntityError/)
      .and.notify(done);
  });
});
