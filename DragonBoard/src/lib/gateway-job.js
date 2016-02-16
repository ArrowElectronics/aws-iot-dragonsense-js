'use strict';

/**
 * Expose 'GatewayJob'
 */
module.exports = GatewayJob;

/**
 * Module dependencies
 */
var schedule = require('node-schedule');
var delayed = require('delayed');

/**
 * Constructor
 * Initialize a new GatewayJob
 */

function GatewayJob(jobs, options) {
  this.options=options;
  this.rule = new schedule.RecurrenceRule();
  this.rule.second=new schedule.Range(0, 59, options.sensorRefresh);

  console.log('executing every: ' + options.sensorRefresh);

  this.jobs = jobs;
  this.counter=0;
}

/**
 * Class Methods
 */

GatewayJob.prototype.execute = function () {
  if (this.jobs.length > 0) {
    if(this.options.roundRobin){
        console.log('round robin strategy')
        if(this.counter < this.jobs.length){
            //do nothing
        }
        else{
            //reset the counter
            this.counter=0;
        }
        
         var tSensorJob = this.jobs[this.counter];
         tSensorJob.execute();
         
         //increment counter
         this.counter +=1;
    }
    else{
        for (var i = 0; i < this.jobs.length; i++) {
            var timeout=this.options.sensorDelay;
            if(i===0){
                timeout=0;
            }
            
            console.log('delaying refresh for: ' + timeout);
            
            var tSensorJob = this.jobs[i];
            //we're gonan delay the read, to make sure that there is enough time to process
            //on slow systems
            delayed.delay(function(){
            tSensorJob.execute();
            }, timeout);
        
        
        }
    }
  }
  else {
    console.log('no sensors to read from');
  }
};

//---------------------------------------