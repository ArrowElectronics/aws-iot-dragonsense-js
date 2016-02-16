var AWS = require('aws-sdk'),
    randomString = require('randomr'),
    uuid = require('uuid'),
    chai = require('chai'),
    chaiAsPromised = require('chai-as-promised'),
    sinon = require('sinon'),
    sinonChai = require('sinon-chai');

chai.use(chaiAsPromised);
chai.use(sinonChai);

chai.should();

var subject = require('resources/led/retrieve');

var config = require('./../../config');

describe('retrieving the led status', function() {
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
        String(randomString(64, 'hex'))
      ]
    };
    var listThingPrincipalsStub = sinon.stub(iot, 'listThingPrincipals');
    listThingPrincipalsStub.yields(null, listThingPrincipalsResponse);

    var date = new Date();
    var resourceNotFoundDetail = {
      "cause": {
        "message": "No shadow exists with name: '" + thingId + "'",
        "code": "ResourceNotFoundException",
        "time": date,
        "statusCode": 404,
        "retryable": false,
        "retryDelay": 30
      },
      "isOperational": true,
      "code": "ResourceNotFoundException",
      "time": date,
      "statusCode": 404,
      "retryable": false,
      "retryDelay": 30
    };

    var iotData = new AWS.IotData({ endpoint: 'data.iot.us-east-1.amazonaws.com' });
    var getThingShadowStub = sinon.stub(iotData, 'getThingShadow');
    getThingShadowStub.yields(AWS.util.error(new Error(), resourceNotFoundDetail), null);

    var message = {
      thingId: thingId
    };

    subject(message, context, iot, iotData)
      .catch(function(err) {
          context.logger.error({ error: err }, testName);

          throw err;
        })
      .finally(function() {
          getThingShadowStub.restore();
          listThingPrincipalsStub.restore();
        })
      .should.eventually.be.rejectedWith(/^ResourceNotFoundError/)
      .and.notify(done);
  });

  it('must throw an exception for an existing thing that has not reported status', function(done) {
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
    var response = {
      "payload": JSON.stringify({
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
      })
    };

    var iotData = new AWS.IotData({ endpoint: 'data.iot.us-east-1.amazonaws.com' });
    var getThingShadowStub = sinon.stub(iotData, 'getThingShadow');
    getThingShadowStub.yields(null, response);

    var message = {
      thingId: thingId
    };

    subject(message, context, iot, iotData)
      .catch(function(err) {
          context.logger.error({ error: err }, testName);

          throw err;
        })
      .finally(function() {
          listThingsStub.restore();
          listThingPrincipalsStub.restore();
          getThingShadowStub.restore();
        })
      .should.eventually.be.rejectedWith(/^ResourceNotFoundError/)
      .and.notify(done);
  });

  it('must return the correct state for an existing thing', function(done) {
    var testName = this.test.fullTitle();

    context.logger.info(testName);

    var thingId = uuid.v4();
    var active = false;

    var expected = {
      thingId: thingId,
      active: active
    };

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
    var response = {
      "payload": JSON.stringify({
        "state": {
          "desired": {
            "active": true
          },
          "reported": {
            "active": active
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
      })
    };

    var iotData = new AWS.IotData({ endpoint: 'data.iot.us-east-1.amazonaws.com' });
    var getThingShadowStub = sinon.stub(iotData, 'getThingShadow');
    getThingShadowStub.yields(null, response);

    var message = {
      thingId: thingId
    };

    subject(message, context, iot, iotData)
      .catch(function(err) {
          context.logger.error({ error: err }, testName);

          throw err;
        })
      .finally(function() {
          listThingsStub.restore();
          listThingPrincipalsStub.restore();
          getThingShadowStub.restore();
        })
      .should.eventually.be.fulfilled
      .and.deep.equal(expected)
      .and.notify(done);
  });
});