'use strict';

/**
 * Expose 'SensorGateway'
 */
module.exports = SensorGateway;

/**
 * Module dependencies
 */
var schedule = require('node-schedule');
var sensorJob = require('./ti-sensortag/sensor-job');
var gatewayJob = require('./gateway-job');
var curl = require('curlrequest');

/**
 * Constants
 */
var tiOptions = {
  readGyroscope: true,
  readMagneto: true,
  readAccel: false,
  readTemp: true,
  readHumidity: true,
  readBarometer: false,
  readLuxometer: true
};

/**
 * Constructor
 * Initialize a new SensorGateway
 */
function SensorGateway(options) {
  this.sensorJobs = [];
  this.options=options;
  this.cleanUp();
}

/**
 * Class Methods
 */

SensorGateway.prototype.addSensor = function (sensorTag) {
  if (sensorTag) {
    console.log('adding: ' + sensorTag.id + ' | type: ' + sensorTag.type);
    var sJob = new sensorJob(this.options.gateway, sensorTag, tiOptions);
    sJob.init();
    this.sensorJobs.push(sJob);
  }
};

//---------------------------------------

SensorGateway.prototype.removeSensor = function (sensorTag) {
  if (sensorTag) {
    if (this.sensorJobs.length > 0) {
      for (var i = 0; i < this.sensorJobs.length; i++) {

      }
    }
  }
};

//---------------------------------------

SensorGateway.prototype.getNumSensors = function () {
  return this.sensorJobs.length;
};

//---------------------------------------

SensorGateway.prototype.readData = function () {

  console.log('scheduling read data...');
  var gj = new gatewayJob(this.sensorJobs, this.options);

  schedule.scheduleJob(gj.rule, function () {
    gj.execute();
  });
};

//---------------------------------------

SensorGateway.prototype.cleanUp = function () {
    console.log('deleting old sensors...');
    var path='/'+this.options.staging+'/things/'+this.options.gateway+'/sensors';
    var url='https://'+this.options.host+path;
    
    console.log('url: ' + url);
    
    var options={
        url:url,
        method:'DELETE'
    };
    
    curl.request(options, function(err, data){
        console.log(data);
    });
    
    console.log('done.');
};

//---------------------------------------