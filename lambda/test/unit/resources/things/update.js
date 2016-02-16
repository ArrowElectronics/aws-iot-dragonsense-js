'use strict';

var AWS = require('aws-sdk'),
    deepcopy = require('deepcopy'),
    uuid = require('uuid'),
    randomString = require('randomr'),
    sinon = require('sinon'),
    chai = require('chai'),
    sinonChai = require('sinon-chai'),
    chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);
chai.use(sinonChai);

chai.should();

var subject = require('resources/things/update');

var config = require('./../../config');

function transformAwsThing(thing, includeAttributes) {
  var returnValue;

  if (thing) {
    returnValue = {
      thingId: thing.thingName
    };

    if (includeAttributes) {
      returnValue.attributes = deepcopy(thing.attributes);
    } else {
      if (thing.hasOwnProperty('attributes')) {
        var attributes = thing.attributes;
        if (Object.keys(attributes).length > 0) {
          returnValue.attributes = deepcopy(thing.attributes);
        }
      }
    }
  }

  return returnValue;
}

describe('updating a thing', function () {
  var context = config.getContext();

  it('should throw an error when attempting to update a non-existent thing', function(done) {
    var self = this;
    var testName = self.test.fullTitle();

    context.logger.info(testName);

    var listThingsResponse = {
      "things": [
        {
          "attributes": {},
          "thingName": uuid.v4()
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

    var message = {
      thingId: uuid.v4(),
      attributes: {}
    };

    subject(message, context, iot)
      .finally(function() {
          listThingsStub.restore();
          listThingPrincipalsStub.restore();
        })
      .should.eventually.be.rejectedWith(/^ResourceNotFoundError/)
      .and.notify(done);
  });

  it('with a name and no attributes should be updated', function (done) {
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

    var updateThingsStub = sinon.stub(iot, 'updateThing');
    updateThingsStub.yields(null, {});

    var message = deepcopy(transformAwsThing(listThingsResponse.things[0], true));
    var expected = deepcopy(transformAwsThing(listThingsResponse.things[0], false));

    subject(message, context, iot)
      .finally(function() {
          listThingsStub.restore();
          listThingPrincipalsStub.restore();
          updateThingsStub.restore();
        })
      .should.eventually.be.fulfilled
      .and.to.deep.equal(expected)
      .and.notify(done);
  });

  it('with a name and attributes should be updated', function(done) {
    var self = this;
    var testName = self.test.fullTitle();

    context.logger.info(testName);

    var iot = new AWS.Iot();

    var thingId = uuid.v4();

    var listThingsResponse = {
      "things": [
        {
          "attributes": {
            "attr1": "val1",
            "attr2": "val2"
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

    var updateThingsStub = sinon.stub(iot, 'updateThing');
    updateThingsStub.yields(null, {});

    var message = deepcopy(transformAwsThing(listThingsResponse.things[0], true));
    var expected = deepcopy(transformAwsThing(listThingsResponse.things[0], false));

    subject(message, context, iot)
      .finally(function() {
        listThingsStub.restore();
        listThingPrincipalsStub.restore();
        updateThingsStub.restore();
      })
      .should.eventually.be.fulfilled
      .and.to.deep.equal(expected)
      .and.notify(done);
  });
});