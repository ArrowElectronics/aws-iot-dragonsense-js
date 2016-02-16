'use strict';

var AWS = require('aws-sdk'),
    uuid = require('uuid'),
    randomString = require('randomr'),
    deepcopy = require('deepcopy'),
    sinon = require('sinon'),
    chai = require('chai'),
    sinonChai = require('sinon-chai'),
    chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);
chai.use(sinonChai);

chai.should();

var subject = require('resources/things/collection');

var config = require('./../../config');

function transformListThingsResponse(result) {
  var returnValue = [];

  var things = result.things;
  if (things && Array.isArray(things)) {
    for (var i = 0; i < things.length; i++) {
      var thing = things[i];

      var entity = {
        thingId: thing.thingName
      };

      if (thing.hasOwnProperty('attributes')) {
        var attributes = thing.attributes;
        if (Object.keys(attributes).length > 0) {
          entity.attributes = deepcopy(thing.attributes);
        }
      }

      returnValue.push(entity);
    }
  }

  return returnValue;
}

describe('retrieve a collection of things', function () {
  var context = config.getContext();

  describe('should deny access without proper permissions', function() {
    it('for listThings', function(done) {
      var self = this;
      var testName = self.test.fullTitle();

      context.logger.info(testName);

      var thingId = 'listThingsPermission';

      var detail = {
        cause: {
          message: 'User: arn:aws:sts::012345678901:assumed-role/lambdaFunction is not authorized to perform: iot:ListThings on resource: arn:aws:iot:us-east-1:012345678901:thing/' + thingId,
          code: 'AccessDeniedException',
          statusCode: 403,
          retryable: false,
          retryDelay: 30
        },
        code: 'AccessDeniedException',
        statusCode: 403,
        retryable: false,
        retryDelay: 30
      };

      var iot = new AWS.Iot();

      var listThingsStub = sinon.stub(iot, 'listThings');
      listThingsStub.throws(AWS.util.error(new Error(), detail));

      var message = {
      };

      subject(message, context, iot)
        .catch(function(err) {
          context.logger.error({ error: err }, testName);

          throw err;
        })
        .finally(function() {
          listThingsStub.restore();
        })
        .should.be.rejectedWith(/^AccessDeniedError/)
        .and.notify(done);
    });

    it('for listThingPrincipals', function(done) {
      var self = this;
      var testName = self.test.fullTitle();

      context.logger.info(testName);

      var thingId = 'listThingPrincipalsPermission';

      var iot = new AWS.Iot();

      var listThingsResult = {
        "things": [
          {
            "attributes": {
              "attr": "val"
            },
            "thingName": "test"
          },
          {
            "attributes": {},
            "thingName": "led"
          }
        ]
      };

      var listThingsStub = sinon.stub(iot, 'listThings');
      listThingsStub.yields(null, listThingsResult);

      var detail = {
        cause: {
          message: 'User: arn:aws:sts::012345678901:assumed-role/lambdaFunction is not authorized to perform: iot:ListThingPrinciples on resource: arn:aws:iot:us-east-1:012345678901:thing/' + thingId,
          code: 'AccessDeniedException',
          statusCode: 403,
          retryable: false,
          retryDelay: 30
        },
        code: 'AccessDeniedException',
        statusCode: 403,
        retryable: false,
        retryDelay: 30
      };

      var listThingPrincipalsStub = sinon.stub(iot, 'listThingPrincipals');
      listThingPrincipalsStub.throws(AWS.util.error(new Error(), detail));

      var message = {
      };

      subject(message, context, iot)
        .catch(function(err) {
          context.logger.error({ error: err }, testName);

          throw err;
        })
        .finally(function() {
          listThingsStub.restore();
          listThingPrincipalsStub.restore();
        })
        .should.be.rejectedWith(/^AccessDeniedError/)
        .and.notify(done);
    });
  });

 it('where all things have no associated principals', function(done) {
    var self = this;
    var testName = self.test.fullTitle();

    context.logger.info(testName);

    var listThingsResponse = {
      "things": [
        {
          "attributes": {
            "attr": "val"
          },
          "thingName": "test"
        },
        {
          "attributes": {},
          "thingName": "led"
        }
      ]
    };

    var iot = new AWS.Iot();

    var listThingsStub = sinon.stub(iot, 'listThings');
    listThingsStub.yields(null, listThingsResponse);

    var listThingPrincipalsStub = sinon.stub(iot, 'listThingPrincipals');
    for (var i = 0; i < listThingsResponse.things.length; i++) {
      var thing = listThingsResponse.things[i];

      listThingPrincipalsStub
        .withArgs({
            thingName: thing.thingName
          })
        .yields(null, {
            "principals": []
          });
    }

    var message = {};

    subject(message, context, iot)
      .finally(function() {
          listThingsStub.restore();
          listThingPrincipalsStub.restore();
        })
      .should.eventually.be.fulfilled
      .and.to.deep.equal([])
      .and.notify(done);
  });

  it('where all things have associated principals', function(done) {
    var self = this;
    var testName = self.test.fullTitle();

    context.logger.info(testName);

    var listThingsResponse = {
      "things": [
        {
          "attributes": {
            "attr": "val"
          },
          "thingName": "test"
        },
        {
          "attributes": {},
          "thingName": "led"
        }
      ]
    };

    var iot = new AWS.Iot();

    var listThingsStub = sinon.stub(iot, 'listThings');
    listThingsStub.yields(null, listThingsResponse);

    var listThingPrincipalsStub = sinon.stub(iot, 'listThingPrincipals');
    for (var i = 0; i < listThingsResponse.things.length; i++) {
      var thing = listThingsResponse.things[i];

      listThingPrincipalsStub
        .withArgs({
            thingName: thing.thingName
          })
        .yields(null, {
            "principals": [
              String(randomString(64, 'hex'))
            ]
          });
    }

    var message = {};

    subject(message, context, iot)
      .finally(function() {
          listThingsStub.restore();
          listThingPrincipalsStub.restore();
        })
      .should.eventually.be.fulfilled
      .and.to.deep.equal(transformListThingsResponse(listThingsResponse))
      .and.notify(done);
  });

  it('where some things have no associated principals', function(done) {
    var self = this;
    var testName = self.test.fullTitle();

    context.logger.info(testName);

    var listThingsResponse = {
      "things": [
        {
          "attributes": {
            "attr": "val"
          },
          "thingName": "test"
        },
        {
          "attributes": {},
          "thingName": "led"
        }
      ]
    };

    var expectedThing = deepcopy(listThingsResponse.things[1]);

    var iot = new AWS.Iot();

    var listThingsStub = sinon.stub(iot, 'listThings');
    listThingsStub.yields(null, listThingsResponse);

    var listThingPrincipalsStub = sinon.stub(iot, 'listThingPrincipals');
    listThingPrincipalsStub
      .withArgs({
          thingName: listThingsResponse.things[0].thingName
        })
      .yields(null, {
          "principals": []
        });
    listThingPrincipalsStub
      .withArgs({
          thingName: expectedThing.thingName
        })
      .yields(null, {
        "principals": [
          String(randomString(64, 'hex'))
        ]
      });

    var message = {};

    subject(message, context, iot)
      .then(function(result) {
        context.logger.info({ result: result }, testName);

        return result;
      })
      .finally(function() {
        listThingsStub.restore();
        listThingPrincipalsStub.restore();
      })
      .should.eventually.be.fulfilled
      .and.to.deep.equal(transformListThingsResponse({
          "things": [
            expectedThing
          ]
        }))
      .and.notify(done);
  });
});
