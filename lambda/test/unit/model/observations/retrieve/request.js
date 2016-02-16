var chai = require('chai'),
    chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);
chai.should();

var ValidationManager = require('model/validationmanager').ValidationManager;

var subjectSchema = require('model/audioEvents/retrieve/request');

var config = require('./../../../config');

describe('the audioEvent retrieve request model', function() {
  var context = config.getContext();
  var validationManager;

  beforeEach(
    function () {
      validationManager = new ValidationManager(context);
    }
  );

  it('must validate a valid request without limit', function(done) {
    var testName = this.test.fullTitle();

    context.logger.info(testName);

    var event = {
      thingId: 'validAudioEventRetrieveRequest'
    };

    validationManager.validate(event, subjectSchema)
      .catch(function(ex) {
          context.logger.error({ error: ex }, testName);

          throw ex;
        })
      .should.eventually.be.fulfilled
      .and.notify(done);
  });

  it('must validate a valid request with limit', function(done) {
    var testName = this.test.fullTitle();

    context.logger.info(testName);

    var event = {
      thingId: 'validAudioEventRetrieveRequest',
      limit: 5
    };

    validationManager.validate(event, subjectSchema)
      .catch(function(ex) {
        context.logger.error({ error: ex }, testName);

        throw ex;
      })
      .should.eventually.be.fulfilled
      .and.notify(done);
  });

  it('must not validate an event with additional properties', function(done) {
    var testName = this.test.fullTitle();

    context.logger.info(testName);

    var event = {
      thingId: 'invalidAudioEventRetrieveRequest',
      additionalProperty: 'val'
    };

    validationManager.validate(event, subjectSchema)
      .catch(function(ex) {
        context.logger.error({ error: ex }, testName);

        throw ex;
      })
      .should.eventually.be.rejectedWith(/^InvalidEntityError/)
      .and.notify(done);
  })
});
