var chai = require('chai'),
    chaiAsPromised = require('chai-as-promised');

chai.use(chaiAsPromised);
chai.should();

var ValidationManager = require('model/validationmanager').ValidationManager;

var subjectSchema = require('model/observations/create/request');

var config = require('./../../../config');

describe('the observations create request model', function() {
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

    var observation = {
      thingId: 'validObservationCreateRequest',
      sensorId: '030d2a14-63f5-4e18-ab55-a8ffdb368d3b',
      observation: {
        "objTemperature": 23.2,
        "ambTemperature": 22.4,
        "luxometer": 1102,
        "accelerometer": [
          1.2, 2.1, 4.8
        ],
        "gyroscope": [
          2.2, 5.2, 3.6
        ],
        "timestamp": 1453331682,
        "lastSend": 1453323628
      }
    };

    validationManager.validate(observation, subjectSchema)
      .catch(function(ex) {
          context.logger.error({ error: ex }, testName);

          throw ex;
        })
      .should.eventually.be.fulfilled
      .and.notify(done);
  });

  it('must not validate an observation with additional properties', function(done) {
    var testName = this.test.fullTitle();

    context.logger.info(testName);

    var event = {
      thingId: 'invalidObservationCreateRequest',
      sensorId: '030d2a14-63f5-4e18-ab55-a8ffdb368d3b',
      observation: {
        "objTemperature": 23.2,
        "ambTemperature": 22.4,
        "luxometer": 1102,
        "accelerometer": [
          1.2, 2.1, 4.8
        ],
        "gyroscope": [
          2.2, 5.2, 3.6
        ],
        "timestamp": 1453331682,
        "lastSend": 1453323628
      },
      additionalProperty: 'val'
    };

    validationManager.validate(event, subjectSchema)
      .catch(function(ex) {
          context.logger.error({ error: ex }, testName);

          throw ex;
        })
      .should.eventually.be.rejectedWith(/^InvalidEntityError/)
      .and.notify(done);
  })
});
