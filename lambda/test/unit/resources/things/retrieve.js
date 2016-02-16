'use strict';

var AWS = require('aws-sdk'),
    uuid = require('uuid'),
    deepcopy = require('deepcopy'),
    chai = require('chai'),
    chaiAsPromised = require('chai-as-promised'),
    sinon = require('sinon'),
    sinonChai = require('sinon-chai');

chai.use(chaiAsPromised);
chai.use(sinonChai);

chai.should();

var subject = require('resources/things/retrieve');

var config = require('./../../config');

describe('retrieve thing', function () {
  var context = config.getContext();

  it('with invalid name should throw an error', function (done) {
    var testName = this.test.fullTitle();

    context.logger.info(testName);

    var iot = new AWS.Iot();

    var listThingsStub = sinon.stub(iot, 'listThings');
    listThingsStub.throws(new TypeError('Not implemented!'));

    var listThingPrincipalsStub = sinon.stub(iot, 'listThingPrincipals');
    listThingPrincipalsStub.throws(new TypeError('Not implemented!'));

    var message = {
      thingId: 'invalidThingName#'
    };

    subject(message, context, iot)
      .catch(function (err) {
          context.logger.error({error: err}, testName);

          throw err;
        })
      .finally(function () {
          listThingsStub.restore();
          listThingPrincipalsStub.restore();
        })
      .should.be.rejectedWith(/^InvalidEntityError/)
      .and.notify(done);
  });
});