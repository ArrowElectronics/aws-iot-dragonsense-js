var Promise = require('bluebird');

var chai = require('chai'),
    chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);
chai.should();

var Validator = require('jsonschema').Validator;

var config = require('./../../config');

var thing = require('model/entity/thing');

var thingIdSchema = {
  "id": "/thingSchema",
  "properties": {
    "thingId": {
      "$ref": "/entity/thing#/definitions/thingId"
    }
  }
};

var attributeSchema = {
  "id": "/attributeSchema",
  "properties": {
    "attribute": {
      "$ref": "/entity/thing#/definitions/attribute"
    }
  }
};

describe('the thing entity model', function() {
  var context = config.getContext();
  var validator;

  beforeEach(function() {
    validator = new Validator();
    validator.addSchema(thing);
  });

  it('must validate a valid name', function(done) {
    var testName = this.test.fullTitle();

    context.logger.info(testName);

    var entity = {
      thingId: 'valid_name0-11'
    };

    Promise.try(function() {
          var result = validator.validate(entity, thingIdSchema);

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
      thingId: 'invalidId#'
    };

    Promise.try(function() {
          var result = validator.validate(entity, thingIdSchema);

          return result.valid;
        })
      .should.eventually.be.equal(false)
      .and.notify(done);
  });

  it('must validate a valid attribute', function(done) {
    var testName = this.test.fullTitle();

    context.logger.info(testName);

    var entity = {
      attribute: {
        attr1: 'val1'
      }
    };

    Promise.try(function() {
          var result = validator.validate(entity, attributeSchema)

          return result.valid;
        })
      .should.eventually.be.equal(true)
      .and.notify(done);
  });
});
