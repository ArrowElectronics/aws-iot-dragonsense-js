'use strict';

/**
 * Expose 'TISensorTagObservation'
 */
module.exports = TISensorTagObservation;

/**
 * Module dependencies
 */
var iUtil = require('../util');
var util = new iUtil();

/**
 * Constants
 */
var INVALID_NUMBER = -9999.9;

/**
 * Constructor
 * Initialize a new TISensorTagObservation
 */
function TISensorTagObservation(thingId, bleId, options) {
  this.thingId = thingId;
  this.systemId = bleId;
  this.options = options;

  this.init();
}

TISensorTagObservation.prototype.init = function () {
  this.timestamp = new Date().getTime();

  this.objTemperature = INVALID_NUMBER;
  this.ambTemperature = INVALID_NUMBER;
  this.humidityTemp = INVALID_NUMBER;
  this.humidity = INVALID_NUMBER;
  this.barometricPressure = INVALID_NUMBER;
  this.luxometer = INVALID_NUMBER;

  this.accelerometer = [];
  this.gyroscope = [];
  this.magnetometer = [];

  this.lastSend = null;
};

/**
 * Class Methods
 * when all the desired attributes are set, send the data
 */
TISensorTagObservation.prototype.checkAndSend = function () {

  var requiredValues = 0;
  var availableValues = 0;

  if (this.systemId) {
    if (this.options.readGyroscope) {
      requiredValues += 1;
      if (this.gyroscope.length > 0) {
        availableValues += 1;
      }
    }

    if (this.options.readMagneto) {
      requiredValues += 1;
      if (this.magnetometer.length > 0) {
        availableValues += 1;
      }
    }

    if (this.options.readAccel) {
      requiredValues += 1;
      if (this.accelerometer.length > 0) {
        availableValues += 1;
      }
    }

    if (this.options.readTemp) {
      requiredValues += 1;
      if (this.objTemperature != INVALID_NUMBER) {
        availableValues += 1;
      }
    }

    if (this.options.readHumidity) {
      requiredValues += 1;
      if (this.humidity != INVALID_NUMBER) {
        availableValues += 1;
      }
    }

    if (this.options.readBarometer) {
      requiredValues += 1;
      if (this.barometricPressure != INVALID_NUMBER) {
        availableValues += 1;
      }
    }

    if (this.options.readLuxometer) {
      requiredValues += 1;
      if (this.luxometer != INVALID_NUMBER) {
        availableValues += 1;
      }
    }

    if (requiredValues === availableValues) {
      //valid sensortag - send it and zero out the values
      this.lastSend = new Date().getTime();

      util.sendToAmazon(this.thingId, ['sensors', this.systemId, 'observations'].join('/'), this.createPayload());

      this.init();
    }
  }
};

//we created this because amazon has a limitation for sending arrays
TISensorTagObservation.prototype.createPayload = function () {
  var result = {};
  result.timestamp = this.timestamp;

  result.objTemperature = this.objTemperature;
  result.ambTemperature = this.ambTemperature;
  result.humidityTemp = this.humidityTemp;
  result.humidity = this.humidity;
  result.barometricPressure = this.barometricPressure;
  result.luxometer = this.luxometer;

  if (this.accelerometer.length === 3) {
    result.accelerometerX = this.accelerometer[0];
    result.accelerometerY = this.accelerometer[1];
    result.accelerometerZ = this.accelerometer[2];
  }

  if (this.gyroscope.length === 3) {
    result.gyroscopeX = this.gyroscope[0];
    result.gyroscopeY = this.gyroscope[1];
    result.gyroscopeZ = this.gyroscope[2];
  }

  if (this.magnetometer.length === 3) {
    result.magnetometerX = this.magnetometer[0];
    result.magnetometerY = this.magnetometer[1];
    result.magnetometerZ = this.magnetometer[2];
  }

  result.lastSend = this.lastSend;

  return result;
};


