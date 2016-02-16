'use strict';

/**
 * Expose 'SensorJob'
 */
module.exports = SensorJob;

/**
 * Module dependencies
 */
var sensorTask = require('./sensor-task');

/**
 * Constructor
 * Initialize a new SensorJob
 */
function SensorJob(thingId, sensorTag, options){
    this.sensorTag = sensorTag;
	this.task= new sensorTask(thingId, sensorTag.id, options);
}

/**
 * Class Methods
 */

SensorJob.prototype.init = function(){
	this.task.connect(this.sensorTag);
};

//---------------------------------------

SensorJob.prototype.execute = function(){
	this.task.readData(this.sensorTag);
};

//---------------------------------------