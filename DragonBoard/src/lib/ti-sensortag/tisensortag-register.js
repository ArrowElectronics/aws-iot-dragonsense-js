'use strict';

/**
 * Expose 'TISensorTagRegister'
 */
module.exports = TISensorTagRegister;

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
 * Initialize a new TISensorTagRegister
 */
function TISensorTagRegister(thingId, bleId) {
  this.thingId = thingId;
  this.systemId = bleId;
  this.init();
}

TISensorTagRegister.prototype.init = function () {
  this.timestamp = new Date().getTime();
  //this.deviceName='';
  this.systemId = '';
  //this.serialNumber='';
  this.firmwareVersion = '';
  this.hardwareVersion = '';
  //this.softwareVersion='';
  this.manufacturerName = '';
};

/**
 * Class Methods
 * when all the desired attributes are set, send the data
 */
TISensorTagRegister.prototype.checkAndSend = function () {

  //sometimes it wont have this data. not sure what to do for that
  if (this.systemId
    && this.manufacturerName
    && this.hardwareVersion
    && this.firmwareVersion) {

    console.log(this.createPayload());

    //valid sensortag - send it and zero out the values
    util.sendToAmazon(this.thingId, 'sensors', this.createPayload());
  }
};

//create this just so that we are consistent in terms of how we send to amazon
TISensorTagRegister.prototype.createPayload = function () {
  var result = {};
  result.timestamp = this.timestamp;
  result.systemId = this.systemId;
  result.firmwareVersion = this.firmwareVersion;
  result.hardwareVersion = this.hardwareVersion;
  result.manufacturerName = this.manufacturerName;
  return result;
};


