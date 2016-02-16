'use strict';

/**
 * Module dependencies.
 */

//http://processors.wiki.ti.com/images/a/a8/BLE_SensorTag_GATT_Server.pdf
//http://processors.wiki.ti.com/index.php/CC2650_SensorTag_User%27s_Guide#Movement_Sensor

//allow max listeners
require('events').EventEmitter.prototype._maxListeners = 100;

var schedule = require('node-schedule');
var sensorTagLib = require('sensortag');
var delayed = require('delayed');
var sensorGatewayLib = require('./lib/sensor-gateway');
var config = require('./config');

/**
 * Constants
 */
var lastFind=null;

/**
 * MAIN APP
 */

//create new sensorGateway
var sensorGateway = new sensorGatewayLib(config);

sensorTagLib.discoverAll(onDiscover);

//stop discovery after a predetermined time period
timedStopDiscover(config.discoveryTime);

//---------------------------------------

function findMoreSensors(){
    if(sensorGateway.getNumSensors() < config.maxSensors){
    }
    else{
        console.log('reached max sensors of: ' + config.maxSensors);
        stopDiscovery();
    }   
}

//---------------------------------------

function onDiscover(sensorTag){
    var timeout=0;
    var currFind=new Date().getTime();
    if(lastFind){
       var diff = currFind-lastFind;
       console.log('diff of find: ' + diff);
       if(diff < config.discoveryDelay){
           timeout=config.discoveryDelay;
       }
    }
    
    console.log('delaying for: ' + timeout);
    
    delayed.delay(function(){
         //console.log('running addSensor');
         sensorGateway.addSensor(sensorTag);
         lastFind=currFind;
         findMoreSensors();
    }, timeout);
   
}

//---------------------------------------

function stopDiscovery(){
   //doesnt stop
   sensorTagLib.stopDiscoverAll(function(){
       console.log('stop discover');
   });
   
   sensorGateway.readData();
}

//---------------------------------------

function timedStopDiscover(waitTime){
    var wt = waitTime;
    
    var job = new schedule.Job(function(wt){
        console.log('waited '+waitTime+' ms...');
        stopDiscovery();
    });
    
    job.schedule(new Date(Date.now() + wt));
}

/**
 * Helper Functions
 */

//---------------------------------------
 
//mod to allow removable of extraneous whitespace
String.prototype.reduceWhiteSpace = function() {
    return this.replace(/\s+/g, ' ');
};

//---------------------------------------

String.prototype.startsWith = function(prefix) {
    return this.indexOf(prefix) === 0;
};