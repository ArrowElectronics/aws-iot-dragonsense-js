var AWS = require('aws-sdk'),
    dynamoDoc = require('dynamodb-doc'),
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

var subject = require('resources/audioEvents/retrieve');

var config = require('./../../config');

describe('retrieving an audioEvent', function() {
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

    var dynamoDb = new AWS.DynamoDB();
    var putItemStub = sinon.stub(dynamoDb, 'query');
    putItemStub.throws(new Error('Not implemented!'));

    var message = {
      thingId: thingId
    };

    subject(message, context, iot, dynamoDb)
      .catch(function(err) {
          context.logger.error({ error: err }, testName);

          throw err;
        })
      .finally(function() {
          listThingsStub.restore();
          listThingPrincipalsStub.restore();
          putItemStub.restore();
        })
      .should.eventually.be.rejectedWith(/^ResourceNotFoundError/)
      .and.notify(done);
  });

  it('must return an empty set if no audio events exist', function(done) {
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

    AWS.config.update({ region: 'us-east-1' });

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

    var noItemsQueryResponse = {
      Items: [],
      Count: 0,
      ScannedCount: 0
    };
    var dynamoDb = new dynamoDoc.DynamoDB();
    var queryStub = sinon.stub(dynamoDb, 'query');
    queryStub.yields(null, noItemsQueryResponse);

    var message = {
      thingId: thingId
    };

    var expected = {
      thingId: thingId,
      events: deepcopy(noItemsQueryResponse.Items)
    };

    subject(message, context, iot, dynamoDb)
      .catch(function(err) {
          context.logger.error({ error: err }, testName);

          throw err;
        })
      .finally(function() {
          listThingsStub.restore();
          listThingPrincipalsStub.restore();
          queryStub.restore();
        })
      .should.eventually.be.fulfilled
      .and.deep.equal(expected)
      .and.notify(done);
  });

  it('must return existing audio events', function(done) {
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

    AWS.config.update({ region: 'us-east-1' });

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

    var audioEventsQueryResponse = {
      Items: [
        {
          observation: {
            timestamp: 4,
            volume: "increase"
          },
          thingId: "test",
          timestamp: 4
        },
        {
          observation: {
            timestamp: 3,
            volume: "decrease"
          },
          thingId: "test",
          timestamp: 3
        },
        {
          observation: {
            timestamp: 2,
            volume: "increase"
          },
          thingId: "test",
          timestamp: 2
        },
        {
          observation: {
            timestamp: 1,
            volume: "decrease"
          },
          thingId: "test",
          timestamp: 1
        }
      ],
      Count: 4,
      ScannedCount: 4
    };
    var dynamoDb = new dynamoDoc.DynamoDB();
    var queryStub = sinon.stub(dynamoDb, 'query');
    queryStub.yields(null, audioEventsQueryResponse);

    var message = {
      thingId: thingId
    };

    var expectedEvents = [];
    for (var i = 0; i < audioEventsQueryResponse.Items.length; i++) {
      expectedEvents.push(deepcopy(audioEventsQueryResponse.Items[i].observation));
    }
    var expected = {
      thingId: thingId,
      events: expectedEvents
    };

    subject(message, context, iot, dynamoDb)
      .catch(function(err) {
        context.logger.error({ error: err }, testName);

        throw err;
      })
      .finally(function() {
        listThingsStub.restore();
        listThingPrincipalsStub.restore();
        queryStub.restore();
      })
      .should.eventually.be.fulfilled
      .and.deep.equal(expected)
      .and.to.satisfy(function(result) {
          var returnValue = true;

          for (var i = 0; i < result.events.length - 1; i++) {
            var current = result.events[i].timestamp;
            var next = result.events[i + 1].timestamp;

            if (next > current) {
              returnValue = false;
              break;
            }
          }

          return returnValue;
        }, 'The results should be ordered in descending order by timestamp')
      .and.notify(done);
  });
});