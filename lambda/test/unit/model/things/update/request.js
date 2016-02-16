var chai = require('chai'),
    chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);
chai.should();

var ValidationManager = require('model/validationmanager').ValidationManager;

var subjectSchema = require('model/things/update/request');

var config = require('./../../../config');

describe('the things update request model', function() {
  var context = config.getContext();
  var validationManager;

  beforeEach(function () {
    validationManager = new ValidationManager(context);
  });

  it('must validate a valid name', function(done) {
    var testName = this.test.fullTitle();

    context.logger.info(testName);

    var thing = {
      thingId: 'valid_name0-11',
      attributes: {}
    };

    validationManager.validate(thing, subjectSchema)
      .catch(function(ex) {
        context.logger.error({ error: ex }, testName);

        throw ex;
      })
      .should.be.fulfilled
      .and.notify(done);
  });

  it('must not validate an invalid name', function(done) {
    var testName = this.test.fullTitle();

    context.logger.info(testName);

    var thing = {
      thingId: 'invalidId#'
    };

    validationManager.validate(thing, subjectSchema)
      .catch(function(ex) {
        context.logger.error({ error: ex }, testName);

        throw ex;
      })
      .should.be.rejectedWith(/^InvalidEntityError/)
      .and.notify(done);
  })
});
