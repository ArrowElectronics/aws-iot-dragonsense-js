var Promise = require('bluebird');

var chai = require('chai'),
    chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);
chai.should();

var Validator = require('jsonschema').Validator;

var config = require('./../../config');

var ledEntity = require('model/entity/led');

var ledSchema = {
  "id": "/ledSchema",
  "properties": {
    "active": {
      "$ref": "/entity/led#/definitions/active"
    }
  }
};

describe('the led entity model', function() {
  var context = config.getContext();
  var validator;

  beforeEach(function() {
    validator = new Validator();
    validator.addSchema(ledEntity);
  });

  it('must validate an active status', function(done) {
    var testName = this.test.fullTitle();

    context.logger.info(testName);

    var entity = {
      active: false
    };

    Promise.try(function() {
          var result = validator.validate(entity, ledSchema);

          return result.valid;
        })
      .should.eventually.be.fulfilled
      .and.equal(true)
      .and.notify(done);
  });

  it('must not validate an invalid name', function(done) {
    var testName = this.test.fullTitle();

    context.logger.info(testName);

    var entity = {
      active: 'invalidValue'
    };

    Promise.try(function() {
          var result = validator.validate(entity, ledSchema);

          return result.valid;
        })
      .should.eventually.be.equal(false)
      .and.notify(done);
  });
});
