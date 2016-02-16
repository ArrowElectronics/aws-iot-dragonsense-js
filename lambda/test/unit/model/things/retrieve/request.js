var chai = require('chai'),
    chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);
chai.should();

var ValidationManager = require('model/validationmanager').ValidationManager;

var subjectSchema = require('model/things/retrieve/request');

var config = require('./../../../config');

describe('the things retrieve request model', function() {
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
      thingId: 'validThingsRetrieveRequest'
    };

    validationManager.validate(thing, subjectSchema)
      .catch(function(ex) {
        context.logger.error({ error: ex }, testName);

        throw ex;
      })
      .should.eventually.be.fulfilled
      .and.notify(done);
  });

  it('must not validate an invalid request', function(done) {
    var testName = this.test.fullTitle();

    context.logger.info(testName);

    var thing = {
      thingId: 'invalidThingsRetrieveRequest',
      attributes: {
        attr: 'val'
      }
    };

    validationManager.validate(thing, subjectSchema)
      .catch(function(ex) {
        context.logger.error({ error: ex }, testName);

        throw ex;
      })
      .should.eventually.be.rejectedWith(/^InvalidEntityError/)
      .and.notify(done);
  })
});
