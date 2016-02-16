'use strict';

/**
 * Expose 'SensorTask'
 */
module.exports = SensorTask;

/**
 * Module dependencies
 */
var async = require('async');
var tiSensorTagObservation = require('./tisensortag-observation');
var tiSensorTagRegister = require('./tisensortag-register');

var READ_DEVICE_NAME = 0;
var READ_SYSTEM_ID = 1;
var READ_SERIAL_NUMBER = 2;
var READ_FIRMWARE_REVISION = 3;
var READ_HARDWARE_REVISION = 4;
var READ_SOFTWARE_REVISION = 5;
var READ_MANUFACTURER_NAME = 6;
var READ_ACCELEROMETER = 7;
var READ_GYROSCOPE = 8;
var READ_MAGNETOMETER = 9;
var READ_IR_TEMPERATURE = 10;
var READ_HUMIDITY = 11;
var READ_BAROMETER = 12;
var READ_LUXOMETER = 13;

/**
 * Constructor
 * Initialize a new SensorTask
 */
function SensorTask(thingId, bleId, options) {
  this.thingId = thingId;
  this.options = options;

  //console.log('constructor: ' + sensorTag.id);

  this.sRegister = new tiSensorTagRegister(thingId, bleId);
  this.sObservation = new tiSensorTagObservation(thingId, bleId, options);
}

//---------------------------------------

SensorTask.prototype.connect = function (sensorTag) {

  console.log('init: ' + sensorTag.id);

  var sensorHandle = sensorTag;
  var sReg = this.sRegister;

  //give access to current object
  var self = this;

  async.series([
    function (callback) {
      sensorHandle.connectAndSetup(callback);
    },
    function (callback) {

      if (self.options.readAccel) {
        sensorHandle.enableAccelerometer();
      }

      if (self.options.readGyroscope) {
        sensorHandle.enableGyroscope();
      }

      if (self.options.readMagneto) {
        sensorHandle.enableMagnetometer();
      }

      if (self.options.readTemp) {
        sensorHandle.enableIrTemperature();
      }

      if (self.options.readHumidity) {
        sensorHandle.enableHumidity();
      }

      if (self.options.readBarometer) {
        sensorHandle.enableBarometricPressure();
      }

      if (self.options.readLuxometer) {
        sensorHandle.enableLuxometer();
      }

      callback();
    },
    function (callback) {
      //read general information
      sensorHandle.readDeviceName(function (error, deviceName) {
        //does nothing
        //self.registerData(READ_DEVICE_NAME, deviceName);
      });
      sensorHandle.readSystemId(function (error, sid) {
        //in mac - these are difference
        //but in ubuntu they are the same - need to strip :
        registerData(sReg, READ_SYSTEM_ID, sid);
      });
      sensorHandle.readSerialNumber(function (error, sn) {
        //does nothing
        //self.registerData(READ_SERIAL_NUMBER, sn);
      });
      sensorHandle.readFirmwareRevision(function (error, fr) {
        registerData(sReg, READ_FIRMWARE_REVISION, fr);
      });
      sensorHandle.readHardwareRevision(function (error, hr) {
        registerData(sReg, READ_HARDWARE_REVISION, hr);
      });
      sensorHandle.readSoftwareRevision(function (error, sr) {
        //does nothing
        //self.registerData(READ_SOFTWARE_REVISION, sr);
      });
      sensorHandle.readManufacturerName(function (error, mn) {
        registerData(sReg, READ_MANUFACTURER_NAME, mn);
      });
    },
    function (callback) {
      setTimeout(callback, 2000);
    }
  ]);
};

//---------------------------------------

SensorTask.prototype.readData = function (sensorTag) {

  console.log('reading data: ' + sensorTag.id);

  var sensorHandle = sensorTag;
  var sObv = this.sObservation;

  async.series([
    function (callback) {
      sensorHandle.readSystemId(function (error, sid) {
        //in mac - these are difference
        //but in ubuntu they are the same - need to strip :
        extractData(sObv, READ_SYSTEM_ID, sid);
      });
      sensorHandle.readIrTemperature(function (error, objT, ambT) {
        extractData(sObv, READ_IR_TEMPERATURE, objT, ambT);
      });

      sensorHandle.readHumidity(function (error, temperature, humidity) {
        extractData(sObv, READ_HUMIDITY, temperature, humidity);
      });

      sensorHandle.readBarometricPressure(function (error, pressure) {
        extractData(sObv, READ_BAROMETER, pressure);
      });

      sensorHandle.readLuxometer(function (error, lux) {
        extractData(sObv, READ_LUXOMETER, lux);
      });

      sensorHandle.readMagnetometer(function (error, x, y, z) {
        extractData(sObv, READ_MAGNETOMETER, x, y, z);
      });

      sensorHandle.readGyroscope(function (error, x, y, z) {
        extractData(sObv, READ_GYROSCOPE, x, y, z);
      });

      sensorHandle.readAccelerometer(function (error, x, y, z) {
        extractData(sObv, READ_ACCELEROMETER, x, y, z);
      });

    }
  ]);
};

//---------------------------------------

function registerData(sRegister, typeData, a, b, c, d) {
  if (a) {
    switch (typeData) {
      case READ_DEVICE_NAME:
        sRegister.softwareVersion = stripControlCharacter(a);
        break;
      case READ_SYSTEM_ID:
        //in this case we are using sensorTag.id as systemid
        sRegister.systemId = stripEverythingNotAlphanumeric(a);
        break;
      case READ_SERIAL_NUMBER:
        sRegister.serialNumber = stripControlCharacter(a);
        break;
      case READ_FIRMWARE_REVISION:
        sRegister.firmwareVersion = stripControlCharacter(a);
        break;
      case READ_HARDWARE_REVISION:
        sRegister.hardwareVersion = stripControlCharacter(a);
        break;
      case READ_SOFTWARE_REVISION:
        sRegister.softwareVersion = stripControlCharacter(a);
        break;
      case READ_MANUFACTURER_NAME:
        sRegister.manufacturerName = stripControlCharacter(a);
        break;
      default:
        console.log('unknown type: ' + typeData);
    }

    sRegister.checkAndSend();
  }
}

//---------------------------------------

function extractData(sObservation, typeData, a, b, c, d) {
  if (a) {
    switch (typeData) {
      case READ_SYSTEM_ID:
        //in this case we are using sensorTag.id as systemid
        sObservation.systemId = stripEverythingNotAlphanumeric(a);
        break;
      case READ_ACCELEROMETER:
        sObservation.accelerometer.push(Number(a.toFixed(1)));
        sObservation.accelerometer.push(Number(b.toFixed(1)));
        sObservation.accelerometer.push(Number(c.toFixed(1)));
        break;
      case READ_GYROSCOPE:
        sObservation.gyroscope.push(Number(a.toFixed(1)));
        sObservation.gyroscope.push(Number(b.toFixed(1)));
        sObservation.gyroscope.push(Number(c.toFixed(1)));
        break;
      case READ_MAGNETOMETER:
        sObservation.magnetometer.push(Number(a.toFixed(1)));
        sObservation.magnetometer.push(Number(b.toFixed(1)));
        sObservation.magnetometer.push(Number(c.toFixed(1)));
        break;
      case READ_IR_TEMPERATURE:
        sObservation.objTemperature = Number(a.toFixed(1));
        sObservation.ambTemperature = Number(b.toFixed(1));
        break;
      case READ_HUMIDITY:
        sObservation.humidityTemp = Number(a.toFixed(1));
        sObservation.humidity = Number(b.toFixed(1));
        break;
      case READ_BAROMETER:
        sObservation.barometricPressure = Number(a.toFixed(1));
        break;
      case READ_LUXOMETER:
        sObservation.luxometer = Number(a.toFixed(1));
        break;
      default:
        console.log('unknown type: ' + typeData);
    }

    sObservation.checkAndSend();
  }
}

//---------------------------------------

function errorOnPeriod() {
  console.log('error setting period');
}

//---------------------------------------

function stripControlCharacter(input) {
  var result = input;
  if (input) {
    result = input.replace(/\0/g, '');
  }
  return result;
}

//---------------------------------------

function stripEverythingNotAlphanumeric(input) {
  var result = input;
  if (input) {
    result = input.replace(/\W/g, '');
  }
  return result;
}