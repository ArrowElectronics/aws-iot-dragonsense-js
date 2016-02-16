var AWS = require('aws-sdk'),
    deepcopy = require('deepcopy'),
    randomString = require('randomr'),
    uuid = require('uuid'),
    chai = require('chai'),
    chaiAsPromised = require('chai-as-promised'),
    sinon = require('sinon'),
    sinonChai = require('sinon-chai');

chai.use(chaiAsPromised);
chai.use(sinonChai);

chai.should();

var subject = require('resources/led/update');

var config = require('./../../config');

describe('updating the led status', function() {
  var context = config.getContext();

  it('must throw an exception for a non-existent thing', function(done) {
    var testName = this.test.fullTitle();

    context.logger.info(testName);

    var thingId = uuid.v4();

    var listThingsResponse = {
      "things": [
        {
          "attributes": {},
          "thingName": thingId
        }
      ]
    };
    var iot = new AWS.Iot();
    var listThingsStub = sinon.stub(iot, 'listThings');
    listThingsStub.yields(null, listThingsResponse);

    var listThingPrincipalsResponse = {
      "principals": [
      ]
    };
    var listThingPrincipalsStub = sinon.stub(iot, 'listThingPrincipals');
    listThingPrincipalsStub.yields(null, listThingPrincipalsResponse);

    var iotData = new AWS.IotData({ endpoint: 'data.iot.us-east-1.amazonaws.com' });
    var updateThingShadowStub = sinon.stub(iotData, 'updateThingShadow');
    updateThingShadowStub.throws(new Error('Not implemented!'));

    var message = {
      thingId: thingId,
      active: false
    };

    subject(message, context, iot, iotData)
      .catch(function(err) {
          context.logger.error({ error: err }, testName);

          throw err;
        })
      .finally(function() {
          listThingsStub.restore();
          listThingPrincipalsStub.restore();
          updateThingShadowStub.restore();
        })
      .should.eventually.be.rejectedWith(/^ResourceNotFoundError/)
      .and.notify(done);
  });

  it('must update the desired state for a thing that has not reported status', function(done) {
    var testName = this.test.fullTitle();

    context.logger.info(testName);

    var thingId = uuid.v4();

    var listThingsResponse = {
      "things": [
        {
          "attributes": {},
          "thingName": thingId
        }
      ]
    };
    var iot = new AWS.Iot();
    var listThingsStub = sinon.stub(iot, 'listThings');
    listThingsStub.yields(null, listThingsResponse);

    var listThingPrincipalsResponse = {
      "principals": [
        String(randomString(64, 'hex'))
      ]
    };
    var listThingPrincipalsStub = sinon.stub(iot, 'listThingPrincipals');
    listThingPrincipalsStub.yields(null, listThingPrincipalsResponse);

    var timestamp = Math.floor(new Date().getTime() / 1000);
    var stateDocument = {
      "state": {
        "desired": {
          "active": true
        }
      },
      "metadata": {
        "desired": {
          "active": {
            "timestamp": timestamp
          }
        },
        "reported": {
          "active": {
            "timestamp": timestamp
          }
        }
      },
      "version": 469,
      "timestamp": timestamp
    };
    var updateThingShadowResponse = {
      "payload": JSON.stringify(stateDocument)
    };

    var iotData = new AWS.IotData({ endpoint: 'data.iot.us-east-1.amazonaws.com' });
    var updateThingShadowStub = sinon.stub(iotData, 'updateThingShadow');
    updateThingShadowStub.yields(null, updateThingShadowResponse);

    var message = {
      thingId: thingId,
      active: false
    };

    var expected = deepcopy(stateDocument.state.desired);
    expected.thingId = thingId;

    subject(message, context, iot, iotData)
      .catch(function(err) {
          context.logger.error({ error: err }, testName);

          throw err;
        })
      .finally(function() {
          listThingsStub.restore();
          listThingPrincipalsStub.restore();
          updateThingShadowStub.restore();
        })
      .should.eventually.be.fulfilled
      .and.deep.equal(expected)
      .and.notify(done);
  });

  it('must update the desired state for a thing that has reported status', function(done) {
    var testName = this.test.fullTitle();

    context.logger.info(testName);

    var thingId = uuid.v4();

    var listThingsResponse = {
      "things": [
        {
          "attributes": {},
          "thingName": thingId
        }
      ]
    };
    var iot = new AWS.Iot();
    var listThingsStub = sinon.stub(iot, 'listThings');
    listThingsStub.yields(null, listThingsResponse);

    var listThingPrincipalsResponse = {
      "principals": [
        String(randomString(64, 'hex'))
      ]
    };
    var listThingPrincipalsStub = sinon.stub(iot, 'listThingPrincipals');
    listThingPrincipalsStub.yields(null, listThingPrincipalsResponse);

    var timestamp = Math.floor(new Date().getTime() / 1000);
    var stateDocument = {
      "state": {
        "desired": {
          "active": true
        },
        "reported": {
          "active": false
        }
      },
      "metadata": {
        "desired": {
          "active": {
            "timestamp": timestamp
          }
        },
        "reported": {
          "active": {
            "timestamp": timestamp
          }
        }
      },
      "version": 469,
      "timestamp": timestamp
    };
    var updateThingShadowResponse = {
      "payload": JSON.stringify(stateDocument)
    };

    var iotData = new AWS.IotData({ endpoint: 'data.iot.us-east-1.amazonaws.com' });
    var updateThingShadowStub = sinon.stub(iotData, 'updateThingShadow');
    updateThingShadowStub.yields(null, updateThingShadowResponse);

    var message = {
      thingId: thingId,
      active: false
    };

    var expected = {
      thingId: thingId,
      active: stateDocument.state.desired.active
    };

    subject(message, context, iot, iotData)
      .catch(function(err) {
          context.logger.error({ error: err }, testName);

          throw err;
        })
      .finally(function() {
          listThingsStub.restore();
          listThingPrincipalsStub.restore();
          updateThingShadowStub.restore();
        })
      .should.eventually.be.fulfilled
      .and.deep.equal(expected)
      .and.notify(done);
  });
});