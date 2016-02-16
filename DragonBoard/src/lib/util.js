'use strict';

/**
 * Expose 'Util'
 */
module.exports = Util;

/**
 * Module dependencies
 */
var awsIot = require('aws-iot-device-sdk');
var config = require('../config');

/**
 * Constants
 */
var DEBUG = true;

var LOCAL_CERT_PATH = './certs/';
var INSTALLED_CERT_PATH = '/home/linaro/certs/';

var awsConnectionPool = {};

/**
 * Constructor
 * Initialize a new NetworkTask
 */
function Util() {
}

// convert the str memory to target unit
// G M K B
Util.prototype.convertStrMemory = function (input, units, isCaseSensitive) {

  var result = 0.0;

  if (input) {

    if (!isCaseSensitive) {
      input = input.toUpperCase();
    }

    var num = extractNumber(input);
    var dist = detectDistance(input, units);

    //if distance is negative, then we divide
    //if positive we multiply
    if (dist) {
      var multiplier = Math.pow(1000, Math.abs(dist));
      if (dist > 0) {
        result = num * multiplier;
      }
      else if (dist < 0) {
        result = num / multiplier;
      }
    }
  }
  return result;
};

//extract the number from a string and keep it as str
Util.prototype.extractNumberStr = function (input) {
  var result = '';
  if (input) {
    var copy = input;
    var numb = copy.match(/[\d\.]+/g);
    result = numb.join('');
  }
  return result;
};

//extract the number from a string
function extractNumber(input) {
  var result = 0.0;
  if (input) {
    var copy = input;
    var numb = copy.match(/[\d\.]+/g);
    result = numb.join('');
  }
  return result;
}

//detect the distance between the current unit and the "to" unit
function detectDistance(currUnit, toUnit) {
  var diff = 0;

  if (currUnit) {
    if (toUnit) {
      var fromVal = convertUnitToNumber(currUnit);
      var toVal = convertUnitToNumber(toUnit);
      diff = fromVal - toVal;
    }
  }
  return diff;
}

//conver the unit to a number so we can standarize
function convertUnitToNumber(input) {
  var result = 0;
  if (input) {
    if (input.indexOf('G') >= 0) {
      result = 3;
    }
    else if (input.indexOf('M') >= 0) {
      result = 2;
    }
    else if (input.indexOf('K') >= 0) {
      result = 1;
    }
    else if (input.indexOf('B') >= 0) {
      result = 0;
    }
  }
  return result;
}

//splits a key value with 2 delimiters, putting the key at the front of the array
Util.prototype.splitKeyValue = function (line, firstDelim, secondDelim) {
  var result = [];

  if (line) {
    var splitKey = line.split(firstDelim);
    if (splitKey) {
      result.push(splitKey[0]);

      if (splitKey.length > 1) {
        for (var i = 1; i < splitKey.length; i++) {
          var temp = splitKey[i].trim();
          if (temp) {
            var tempSplit = temp.split(secondDelim);
            if (tempSplit) {
              //concat the results of tempsplit back on to result
              result = result.concat(tempSplit);
            }
          }
        }
      }
    }
  }
  return result;
};

//given a string, split into key value and return the value
Util.prototype.getValueFromKeyValueStr = function (input, delim) {
  if (input) {
    var keyValue = input.split(delim);
    if (keyValue && keyValue.length == 2) {
      return keyValue[1].trim().replace(/"/g, '');
    }
  }

  return '';
};

/**
 * IMPLEMENT AWS IOT SDK
 */

//we take in a topic and the result we want to send
//contained in the result is the thingId that we want to use as a clientId
Util.prototype.sendToAmazon = function (thingId, topic, results) {
  if (results) {
    var clientId = thingId;
    var message = JSON.stringify(results);
    
    console.log('enter sendToAmazon');
    var isWritten=false;
    //device key = private.pem.key
    //device identity = certificate.pem.crt

    var certPath = '';

    //run locally?
    if (DEBUG) {
      //console.log('searching locally for certs');
      certPath = LOCAL_CERT_PATH;
    }
    else {
      certPath = config.awsConfig.certificatePath;
    }

    var mTopic = ['things', thingId, topic].join('/');

    var wDevice = null;
    var device = null;

    if (awsConnectionPool.hasOwnProperty(results.thingId)) {
      wDevice = awsConnectionPool[results.thingId];
    }
    else {
      //build a new connection
      device = awsIot.device({
        keyPath: certPath + config.awsConfig.privateKey,
        certPath: certPath + config.awsConfig.pemCertificate,
        caPath: certPath + config.awsConfig.rootCertificate,
        clientId: clientId,
        region: config.awsConfig.region
      });

      //store the connection into the queue
      device.on('connect', function () {
        console.log('aws queue connected.');
        awsConnectionPool[results.thingId] = device;
        
        if(message && !isWritten){
            //we write here or else it gets lost
            console.log('writing to ' + mTopic);
            console.log('PUBLISHING:' + message);
            device.publish(mTopic, message);
            console.log('published');
            isWritten=true;
        }
        else{
            console.log('message was empty on connect');
        }
      });

      device.on('close', function () {
        console.log('aws queue closed.');
        delete awsConnectionPool[results.thingId];
      });

      device.on('reconnect', function () {
        console.log('aws queue reconnected...');
        awsConnectionPool[results.thingId] = device;
      });
    }

    if (awsConnectionPool.hasOwnProperty(results.thingId)) {
      wDevice = awsConnectionPool[results.thingId];
      if(message && !isWritten){
        console.log('writing to ' + mTopic);
        console.log('PUBLISHING:' + message);
        wDevice.publish(mTopic, message);
        console.log('published');
        isWritten=true;
      }
      else{
            console.log('message was empty on connect');
      }
    }
  }
  else {
    console.log('no results returned');
  }
};
