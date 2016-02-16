'use strict';

var AWS = require('aws-sdk'),
    randomString = require('randomr'),
    uuid = require('uuid'),
    deepcopy = require('deepcopy'),
    sinon = require('sinon'),
    chai = require('chai'),
    sinonChai = require('sinon-chai'),
    chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);
chai.use(sinonChai);

chai.should();

var subject = require('resources/things/single');

var config = require('./../../config');

function transformAwsThing(thing) {
  var returnValue;

  if (thing) {
    returnValue = {
      thingId: thing.thingName
    };

    if (thing.hasOwnProperty('attributes')) {
      var attributes = thing.attributes;
      if (Object.keys(attributes).length > 0) {
        returnValue.attributes = deepcopy(thing.attributes);
      }
    }
  }

  return returnValue;
}

describe('retrieve a single thing', function () {
  var context = config.getContext();

  it('with name and no attributes', function(done) {
    var self = this;
    var testName = self.test.fullTitle();

    context.logger.info(testName);

    var iot = new AWS.Iot();

    var thingId = uuid.v4();

    var listThingsResponse = {
      "things": [
        {
          "attributes": {},
          "thingName": thingId
        }
      ]
    };

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

    var message = {
      thingId: thingId
    };

    subject(message, context, iot)
      .finally(function() {
          listThingsStub.restore();
          listThingPrincipalsStub.restore();
        })
      .should.eventually.be.fulfilled
      .and.to.deep.equal(transformAwsThing(listThingsResponse.things[0]))
      .and.notify(done);
  });

  it('with name and attributes', function (done) {
    var self = this;
    var testName = self.test.fullTitle();

    context.logger.info(testName);

    var iot = new AWS.Iot();

    var thingId = uuid.v4();

    var listThingsResponse = {
      "things": [
        {
          "attributes": {
            "attr1": uuid.v4(),
            "attr2": uuid.v4()
          },
          "thingName": thingId
        }
      ]
    };

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

    var message = {
      thingId: thingId
    };

    subject(message, context, iot)
      .finally(function() {
        listThingsStub.restore();
        listThingPrincipalsStub.restore();
      })
      .should.eventually.be.fulfilled
      .and.to.deep.equal(transformAwsThing(listThingsResponse.things[0]))
      .and.notify(done);
  });

  it('should fail for non-existent thing', function(done) {
    var self = this;
    var testName = self.test.fullTitle();

    context.logger.info(testName);

    var iot = new AWS.Iot();

    var thingId = uuid.v4();

    var listThingsResponse = {
      "things": [
        {
          "attributes": {},
          "thingName": thingId
        }
      ]
    };

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

    var message = {
      thingId: uuid.v4()
    };

    subject(message, context, iot)
      .finally(function() {
        listThingsStub.restore();
        listThingPrincipalsStub.restore();
      })
      .should.eventually.be.rejectedWith(/^ResourceNotFoundError/)
      .and.notify(done);
  });
});
