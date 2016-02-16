//init some globals
var s1GyroChart;
var s2GyroChart;
//var s3GyroChart;

var s1AccelChart;
var s2AccelChart;
//var s3AccelChart;

var s1Interval;
var s2Interval;
//var s3Interval;

//moved to config.js
//const DB_API = '';

const THINGS_ENDPOINT='things';
const SENSOR_ENDPOINT = '/sensors';
const OBSERVATION_ENDPOINT='/observations';

const LOCAL_THINGS= 'things.json';
const LOCAL_SENSOR_LIST='sensors.json';

//---------------------------------------

/**
 * add an apply to string
 * replace string placeholders with values
 * 'this is a value of {1}'.apply(100) ===> 'this is a value of 100'
 */
String.prototype.apply = function() {
    var a = arguments;

    return this.replace(/\{(\d+)\}/g, function(m, i) {
        return a[i - 1];
    });
};

//---------------------------------------

/**
 * add a has to array
 * returns true if array contains the string
 * @param {string} v - value to search for
 */
Array.prototype.has = function(v) {
    return $.inArray(v, this) > -1;
};

//---------------------------------------

/**
 * extract the key, we assume the key to be constructed using -
 * @param {string} input - original string
 * @param {number} idx - index to return, starts at 0
 */
function extractKey(input, idx){
  // console.log('extracting: ' + input);
  if(input){
    var sp= input.split('-');
    if(idx){
      // console.log('extracted: ' + sp[idx]);
      return sp[idx];
    }
    else{
      // console.log('extracted: ' + sp[1]);
      return sp[1];
    }
  }
  return '';
}

//---------------------------------------
// UI LIB
//---------------------------------------

(function (uilib, $, undefined){

   /**
   * generic function to make ajax calls
   * @param {string} thingId - the thingId to get data about
   * @param {string} dType - the type of data to query for
   */
	 uilib.refreshData = function(thingId, dType, sensorId){

      var params={};
  	 	//params.limit=10;

      var baseUrl=''+DB_API;

     if(DEBUG){
        //things/{thingId}/{sid}.json
        baseUrl='{1}/{2}/{3}';
      }
      else{
        //https://d5seqzixk7.execute-api.us-east-1.amazonaws.com/dev/things/sensorgateway1/sensors/b0b4480000b8d000/observations
        baseUrl+='/{1}/{2}{3}/{4}{5}';
      }

      var actionUrl='';
      var readFn;
      var alwaysFn;
      var validParams = false;
 
      if(thingId){
        if(dType){
          if(dType==='sensor'){
            if(DEBUG){
                 actionUrl = baseUrl.apply(THINGS_ENDPOINT, thingId, mapLocalToBleId(sensorId));
            }
            else{
                 actionUrl = baseUrl.apply(THINGS_ENDPOINT, thingId, SENSOR_ENDPOINT, sensorId, OBSERVATION_ENDPOINT);
            }
            readFn = uilib.readSensorData;
            alwaysFn = uilib.alwaysSensor;
            validParams = true;
          }
          else{
            //invalid data type
            console.log('invalid data type');
          }
        }
        else{
          //must contain type
          console.log('no data type');
        }
      }
      else{
        //must have thing id
        console.log('no thing id');
      }

      //if valid params then make the ajax call
      if(validParams){
        var jqxhr = $.ajax({
          url: actionUrl,
          crossDomain: true,
          jsonp: false,
          cache: false,
          contentType: 'application/json',
          data: params
        })
        .done(readFn)
        .fail(function(data,txtStatus,jqXHR){
            console.log('fail');
        })
        .always(alwaysFn);
      }

    return false;

    };

    //---------------------------------------
    // SENSOR
    //---------------------------------------
    
    /**
     * read the successful data for sensor topic
     * @param {object} data - topic should return a JSON object
     * @param {string} txtStatus - standard return from jquery ajax
     * @param {object} jqXHR - jquery handle
     */
    uilib.readSensorData = function (data, txtStatus, jqXHR){
        var sensorObject;
        if (DEBUG) {
            if(Array.isArray(data)){
              sensorObject = data;
            }else{
              sensorObject = JSON.parse(data);
            }
        } else {
            sensorObject = data;
        }

        if(sensorObject){
           var dataObject={};
           var gyroMax={};
           gyroMax.x=0.0;
           gyroMax.y=0.0;
           gyroMax.z=0.0;
           var gyroMin={};
           gyroMin.x=99999.0;
           gyroMin.y=99999.0;
           gyroMin.z=99999.0;

           var accelMax={};
           accelMax.x=0.0;
           accelMax.y=0.0;
           accelMax.z=0.0;
           var accelMin={};
           accelMin.x=99999.0;
           accelMin.y=99999.0;
           accelMin.z=99999.0;

           var magnetMax={};
           magnetMax.x=0.0;
           magnetMax.y=0.0;
           magnetMax.z=0.0;
           var magnetMin={};
           magnetMin.x=99999.0;
           magnetMin.y=99999.0;
           magnetMin.z=99999.0;

           var lux={};
           lux.min=99999.0;
           lux.max=0.0;
           var temp={};
           temp.min=99999.0;
           temp.max=0.0;
           var gyroX=[];
           gyroX.push('x');
           var gyroY=[];
           gyroY.push('y');
           var gyroZ=[];
           gyroZ.push('z');
           var accelX=[];
           accelX.push('x');
           var accelY=[];
           accelY.push('y');
           var accelZ=[];
           accelZ.push('z');
           var magnetX=[];
           magnetX.push('x');
           var magnetY=[];
           magnetY.push('y');
           var magnetZ=[];
           magnetZ.push('z');
           //sensorObject should be a list?
           if(sensorObject.length > 0){
               for(var i=0; i<sensorObject.length; i++){
                   var sensorRow = sensorObject[i];
                   if(sensorRow){
                       if(i==0){
                           lux.current = sensorRow.luxometer;
                           temp.current = sensorRow.ambTemperature;
                           //changed to take in sensorId
                           //dataObject.systemId=sensorRow.systemId;
                           dataObject.systemId=sensorRow.systemId;
                           dataObject.bleId=sensorRow.systemId;
                       }
                       else{
                           //check lux
                           var rLux =  sensorRow.luxometer;
                           if(rLux > lux.max){
                               lux.max = rLux;
                           }
                           if(rLux < lux.min){
                               lux.min = rLux;
                           }
                           
                           //check temp
                           var rTemp =  sensorRow.ambTemperature;
                           if(rTemp > temp.max){
                               temp.max = rTemp;
                           }
                           if(rTemp < temp.min){
                               temp.min = rTemp;
                           }
                           
                           if(sensorRow.hasOwnProperty('gyroscope')){
                             var gyroData = sensorRow.gyroscope;
                             if(gyroData.length === 3){
                                 gyroX.push(gyroData[0]);
                                  if(gyroData[0] > gyroMax.x){
                                      gyroMax.x = gyroData[0];
                                  }
                                  if(gyroData[0] < gyroMin.x){
                                      gyroMin.x = gyroData[0];
                                  }
                             
                                 gyroY.push(gyroData[1]);
                                  if(gyroData[1] > gyroMax.y){
                                      gyroMax.y = gyroData[1];
                                  }
                                  if(gyroData[1] < gyroMin.y){
                                      gyroMin.y = gyroData[1];
                                  }
                                  
                                 gyroZ.push(gyroData[2]);
                                  if(gyroData[2] > gyroMax.z){
                                      gyroMax.z = gyroData[2];
                                  }
                                  if(gyroData[2] < gyroMin.z){
                                      gyroMin.z = gyroData[2];
                                  }
                             }
                           }
                           
                           if(sensorRow.hasOwnProperty('accelerometer')){
                             var accelData= sensorRow.accelerometer;
                             if(accelData.length === 3){
                                 accelX.push(accelData[0]);
                                  if(accelData[0] > accelMax.x){
                                      accelMax.x = accelData[0];
                                  }
                                  if(accelData[0] < accelMin.x){
                                      accelMin.x = accelData[0];
                                  }
                                 accelY.push(accelData[1]);
                                  if(accelData[1] > accelMax.y){
                                      accelMax.y = accelData[1];
                                  }
                                  if(accelData[1] < accelMin.y){
                                      accelMin.y = accelData[1];
                                  }
                                 accelZ.push(accelData[2]);
                                  if(accelData[2] > accelMax.z){
                                      accelMax.z = accelData[2];
                                  }
                                  if(accelData[2] < accelMin.z){
                                      accelMin.z = accelData[2];
                                  }
                             }
                           }

                           if(sensorRow.hasOwnProperty('magnetometer')){
                             var magnetData= sensorRow.magnetometer;
                             if(magnetData.length === 3){
                                 magnetX.push(magnetData[0]);
                                  if(magnetData[0] > magnetMax.x){
                                      magnetMax.x = magnetData[0];
                                  }
                                  if(magnetData[0] < magnetMin.x){
                                      magnetMin.x = magnetData[0];
                                  }
                                 magnetY.push(magnetData[1]);
                                  if(magnetData[1] > magnetMax.y){
                                      magnetMax.y = magnetData[1];
                                  }
                                  if(magnetData[1] < magnetMin.y){
                                      magnetMin.y = magnetData[1];
                                  }
                                 magnetZ.push(magnetData[2]);
                                  if(magnetData[2] > magnetMax.z){
                                      magnetMax.z = magnetData[2];
                                  }
                                  if(magnetData[2] < magnetMin.z){
                                      magnetMin.z = magnetData[2];
                                  }
                             }
                           }
                       }
                   }
               }
           }
           
           dataObject.gyroMax=gyroMax;
           dataObject.gyroMin=gyroMin;
           dataObject.accelMax=accelMax;
           dataObject.accelMin=accelMin;
           dataObject.magnetMax=magnetMax;
           dataObject.magnetMin=magnetMin;

           dataObject.gyroData = [];
           dataObject.gyroData.push(gyroX);
           dataObject.gyroData.push(gyroY);
           dataObject.gyroData.push(gyroZ);

           dataObject.accelData = [];
           dataObject.accelData.push(accelX);
           dataObject.accelData.push(accelY);
           dataObject.accelData.push(accelZ);

           dataObject.magnetData = [];
           dataObject.magnetData.push(magnetX);
           dataObject.magnetData.push(magnetY);
           dataObject.magnetData.push(magnetZ);
           
           dataObject.temp=temp;
           dataObject.lux=lux;
           
           var updateTime = moment.utc(sensorObject.timestamp);
           dataObject.updateTime=updateTime.from(moment());
           
           paintSensorData(dataObject.bleId, dataObject);
           
        }
    };

    //---------------------------------------

  /**
   * on the return of the ajax call, a catch-all to display error message for the user
   * @param {object} data - returned data from ajax call
   * @param {string} txtStatus - standard return from jquery ajax
   * @param {object} jqXHR - jquery handle
   */
    uilib.alwaysSensor = function(data, txtStatus, jqXHR){
        var pUpdate=$('#status-alert');

        if(jqXHR.status === 200){
          //manageCallbackResult(pUpdate, moment().format('YYYY-MM-DD hh:mm:ss'));
        }
        else{
          manageCallbackResult(pUpdate,'<span class=\"text-danger\">ajax error</span>');
        }
    };

    //---------------------------------------

    /**
    * based on the sensorId and data, paint to screen
    * @param {string} sensorId - id of the sensor
    * @param {object} dataObj - object encapsulating sensor data
    */
    function paintSensorData(sensorId, dataObj){

        if(sensorId && dataObj){
            var sensorNumber = detectWhichSensor(sensorId);
            var gD = {};
                gD.columns = [];
                gD.columns.push(dataObj.gyroData[0]);
                gD.columns.push(dataObj.gyroData[1]);
                gD.columns.push(dataObj.gyroData[2]);

            var aD = {};
                aD.columns = [];
                aD.columns.push(dataObj.accelData[0]);
                aD.columns.push(dataObj.accelData[1]);
                aD.columns.push(dataObj.accelData[2]);

            var gyroStats='';
            gyroStats+=buildStatsTable(dataObj.gyroMax, 'Max &deg;/s :');
            gyroStats+=buildStatsTable(dataObj.gyroMin, 'Min &deg;/s :');

            var accelStats='';
            accelStats+=buildStatsTable(dataObj.accelMax, 'Max m/s<sup>2</sup> :');
            accelStats+=buildStatsTable(dataObj.accelMin, 'Min m/s<sup>2</sup> :');

            var tempStats='';
            tempStats+=buildRangeTable(dataObj.temp, '&deg; Range :');
            var luxStats='';
            luxStats+=buildRangeTable(dataObj.lux, 'Range :');

            if(sensorNumber == 1){
                var s1ThingId = $('#s1-thingid');
                var s1GyroStats = $('#s1-gyro-stats');
                var s1AccelStats = $('#s1-accel-stats');
                var s1TempStats = $('#s1-temp-stats');
                var s1LuxStats = $('#s1-lux-stats');
                var s1Temp = $('#s1-temp');
                var s1Lux = $('#s1-lux');
                var s1Update = $('#s1-update');
                
                s1ThingId.html(displaySensorId(sensorId));
                s1Temp.html(dataObj.temp.current + '&deg;');
                s1Lux.html(dataObj.lux.current);
                s1GyroStats.html(gyroStats);
                s1AccelStats.html(accelStats);
                s1TempStats.html(tempStats);
                s1LuxStats.html(luxStats);
                
                s1Update.html('<i class=\"reset-icon\"></i> {1}'.apply(dataObj.updateTime));
                
                s1GyroChart.load(gD);
                s1AccelChart.load(aD);
            }
            else if(sensorNumber == 2){
                var s2ThingId = $('#s2-thingid');
                var s2GyroStats = $('#s2-gyro-stats');
                var s2AccelStats = $('#s2-accel-stats');
                var s2TempStats = $('#s2-temp-stats');
                var s2LuxStats = $('#s2-lux-stats');
                var s2Temp = $('#s2-temp');
                var s2Lux = $('#s2-lux');
                var s2Update = $('#s2-update');
                
                s2ThingId.html(displaySensorId(sensorId));
                s2Temp.html(dataObj.temp.current+ '&deg;');
                s2Lux.html(dataObj.lux.current);
                s2GyroStats.html(gyroStats);
                s2AccelStats.html(accelStats);
                s2TempStats.html(tempStats);
                s2LuxStats.html(luxStats);
                
                s2Update.html('<i class=\"reset-icon\"></i> {1}'.apply(dataObj.updateTime));
                
                s2GyroChart.load(gD);
                s2AccelChart.load(aD);
            
            }
            else if(sensorNumber == 3){
                var s3ThingId = $('#s3-thingid');
                var s3GyroStats = $('#s3-gyro-stats');
                var s3AccelStats = $('#s3-accel-stats');
                var s3TempStats = $('#s3-temp-stats');
                var s3LuxStats = $('#s3-lux-stats');
                var s3Temp = $('#s3-temp');
                var s3Lux = $('#s3-lux');
                var s3Update = $('#s3-update');
                
                s3ThingId.html(displaySensorId(sensorId));
                s3Temp.html(dataObj.temp.current+ '&deg;');
                s3Lux.html(dataObj.lux.current);
                s3GyroStats.html(gyroStats);
                s3AccelStats.html(accelStats);
                s3TempStats.html(tempStats);
                s3LuxStats.html(luxStats);
                
                s3Update.html('<i class=\"reset-icon\"></i> {1}'.apply(dataObj.updateTime));
                
                s3GyroChart.load(gD);
                s3AccelChart.load(aD);
            }
        }
    }

    //---------------------------------------
    // THINGS
    //---------------------------------------
    
    uilib.getThings = function(){
        
        var baseUrl=''+DB_API;
        var actionUrl='';
        
        if(DEBUG){
            //things/things.json
            baseUrl='{1}/{2}';
            actionUrl = baseUrl.apply(THINGS_ENDPOINT, LOCAL_THINGS);
        }
        else{
            //https://d5seqzixk7.execute-api.us-east-1.amazonaws.com/dev/things
            baseUrl+='/{1}';
            actionUrl = baseUrl.apply(THINGS_ENDPOINT);
        }

        $('#menu-select-device').html('<li><a href=\"#\"><img src=\"gfxs/ajax-loader.gif\"/> getting things...</a></li>');

        var jqxhr = $.ajax({
          url: actionUrl,
          crossDomain: true,
          jsonp: false,
          cache: false,
          contentType: 'application/json'
        })
        .done(uilib.readThingsData)
        .fail(uilib.alwaysThings);
    }

    //---------------------------------------
    
    uilib.readThingsData = function (data, txtStatus, jqXHR){
        //fill #menu-select-device
        var sAlert=$('#status-alert');

        var thingsObj;
        if (DEBUG) {
            if(Array.isArray(data)){
              thingsObj = data;
            }else{
              thingsObj = JSON.parse(data);
            }
        } else {
            thingsObj = data;
        }
        if(thingsObj){
          var menuDevices = $('#menu-select-device');
          var menuContent='';
          var menuListTemplate='<li><a href=\"#\" id=\"device-{1}\" class=\"btn-device\">{2}</a></li>';

          if(thingsObj.length > 0){
            for(var i=0; i<thingsObj.length; i++){
              var aThing = thingsObj[i];
              var dId = aThing.thingId;
              if(dId){
                var aStr = menuListTemplate.apply(dId, dId);
                menuContent+=aStr;
              }
            }
          }

          menuDevices.html(menuContent);

          manageStatusAlert(sAlert, false, '');
        }
        else{
          manageStatusAlert(sAlert, true, '<span class=\"text-warning\">invalid json</span>');
        }
    };

    //---------------------------------------

    uilib.alwaysThings = function(data, txtStatus, jqXHR){

        var sAlert=$('#status-alert');

        if(jqXHR.status === 200){
          //manageCallbackResult(gUpdate, moment().format('YYYY-MM-DD hh:mm:ss'));
        }
        else{
          manageStatusAlert(sAlert, true, '<span class=\"text-danger\">ajax error : could not get list of devices</span>');
        }
    };

    //---------------------------------------
    // SENSORS
    //---------------------------------------

    uilib.getSensorList = function(thingId){
        
        //reset the sensor list
        SENSORS=[];
        var baseUrl=''+DB_API;
        var actionUrl='';
        
        if(DEBUG){
          //things/sensorgateway1/sensors.json
          baseUrl='{1}/{2}/{3}';
          actionUrl = baseUrl.apply(THINGS_ENDPOINT, thingId, LOCAL_SENSOR_LIST);
        }
        else{
          //https://d5seqzixk7.execute-api.us-east-1.amazonaws.com/dev/things/sensorgateway1/sensors
          baseUrl+='/{1}/{2}{3}';
          actionUrl = baseUrl.apply(THINGS_ENDPOINT, thingId, SENSOR_ENDPOINT);
        }

        var jqxhr = $.ajax({
          url: actionUrl,
          crossDomain: true,
          jsonp: false,
          cache: false,
          contentType: 'application/json'
        })
        .done(uilib.readSensorList)
        .fail(uilib.alwaysSensorList)
        .always(uilib.alwaysSensorList);
    }

    //---------------------------------------
    
    uilib.readSensorList = function (data, txtStatus, jqXHR){
        //fill #menu-select-device
        var sAlert=$('#status-alert');

        var sensorListObj;
        if (DEBUG) {
            if(Array.isArray(data)){
              sensorListObj = data;
            }else{
              sensorListObj = JSON.parse(data);
            }
        } 
        else {
            sensorListObj = data;
        }

        if(sensorListObj){
          if(sensorListObj.length > 0){
            for(var i=0; i<sensorListObj.length; i++){
              var aSensor = sensorListObj[i];
              var sId = aSensor.systemId;
              if(sId){
                console.log('adding: ' + sId);
                SENSORS.push(sId);
              }
            }
          }

          manageStatusAlert(sAlert, false, '');
        }
        else{
          manageStatusAlert(sAlert, true, '<span class=\"text-warning\">invalid json</span>');
        }
    };

    //---------------------------------------

    uilib.alwaysSensorList = function(data, txtStatus, jqXHR){

        var sAlert=$('#status-alert');

        if(jqXHR.status === 200){
          //manageCallbackResult(gUpdate, moment().format('YYYY-MM-DD hh:mm:ss'));

            if(SENSORS.length > 0){

              //sensor 1
              if(SENSORS.length >= 1){
                console.log('starting sensor 1');
                clearInterval(s1Interval);
                s1Interval = setInterval(function(){
                  uilib.refreshData(THING_ID,'sensor', SENSORS[0])
                }, SENSOR_REFRESH_INTERVAL);

              }

              //sensor 2
              if(SENSORS.length >=2){
                console.log('starting sensor 2');
                clearInterval(s2Interval);
                s2Interval = setInterval(function(){
                  uilib.refreshData(THING_ID,'sensor', SENSORS[1])
                }, SENSOR_REFRESH_INTERVAL);
              }
            }
            else{
              console.log('no sensors found');
            }
        }
        else{
          manageStatusAlert(sAlert, true, '<span class=\"text-danger\">ajax error : could not get list of devices</span>');
        }
    };

    //---------------------------------------
    // STATUS / CALLBACKS
    //---------------------------------------

    /**
     * write the status into an element
     * @param {object} element - jquery handle to the element
     * @param {string} message - string to paint into html dom
     */
    function manageCallbackResult(element, message){
      if(element){
        element.html(message);
      }
    }

    //---------------------------------------

    function manageStatusAlert(element, enable, message){
      if(element){
        if(enable){
          element.show();
        }
        else{
          element.hide();
        }

        if(message){
          element.html(message);
        }
      }
    }

}(window.uilib = window.uilib || {}, $));

//---------------------------------------
// DOCUMENT READY
//---------------------------------------

$(document).ready(function() {

   s1GyroChart = c3.generate({
      bindto: '#s1-gyro-chart',
      size: {
          height: 145
      },
      bar: {
          width: 15
      },
      padding: {
          top: 20,
          left: 30
      },
      data: {
          columns: [
          ],
          colors: {
              x: '#FC3C20',
              y: '#69B11A',
              z: '#3D9AD1'
          }
      },
      axis: {
          x: {
              show: false
          },
          y: {
              tick: {
                  count: 7,
                  format: function (y) { return y.toFixed(1); },
              },
              padding: {
                  top: 0,
                  bottom: 0
              }
          }
      },
      grid: {
          y: {
              show: true
          }
      },
      point: {
          show: false
      },
      legend: {
          show: false
      }
  });

  //---------------------------------------
   
  s1AccelChart = c3.generate({
      bindto: '#s1-accel-chart',
      size: {
          height: 145
      },
      bar: {
          width: 15
      },
      padding: {
          top: 20,
          left: 20
      },
      data: {
          columns: [
          ],
          colors: {
              x: '#FC3C20',
              y: '#69B11A',
              z: '#3D9AD1'
          }
      },
      axis: {
          x: {
              show: false
          },
          y: {
              tick: {
                  count: 7,
                  format: function (y) { return y.toFixed(1); },
              },
              padding: {
                  top: 0,
                  bottom: 0
              }
          }
      },
      grid: {
          y: {
              show: true
          }
      },
      point: {
          show: false
      },
      legend: {
          show: false
      }
  });

  //---------------------------------------
   
   s2GyroChart = c3.generate({
      bindto: '#s2-gyro-chart',
      size: {
          height: 145
      },
      bar: {
          width: 15
      },
      padding: {
          top: 20,
          left: 30
      },
      data: {
          columns: [
          ],
          colors: {
              x: '#FC3C20',
              y: '#69B11A',
              z: '#3D9AD1'
          }
      },
      axis: {
          x: {
              show: false
          },
          y: {
              tick: {
                  count: 7,
                  format: function (y) { return (y > 0) ? "+" + Math.floor(y): Math.floor(y); },

              },
              padding: {
                  top: 0,
                  bottom: 0
              }
          }
      },
      grid: {
          y: {
              show: true
          }
      },
      point: {
          show: false
      },
      legend: {
          show: false
      }
  });

  //---------------------------------------
   
  s2AccelChart = c3.generate({
      bindto: '#s2-accel-chart',
      size: {
          height: 145
      },
      bar: {
          width: 15
      },
      padding: {
          top: 20,
          left: 20
      },
      data: {
          columns: [
          ],
          colors: {
              x: '#FC3C20',
              y: '#69B11A',
              z: '#3D9AD1'
          }
      },
      axis: {
          x: {
              show: false
          },
          y: {
              tick: {
                  count: 7,
                  format: function (y) { return (y > 0) ? "+" + Math.floor(y): Math.floor(y); },

              },
              padding: {
                  top: 0,
                  bottom: 0
              }
          }
      },
      grid: {
          y: {
              show: true
          }
      },
      point: {
          show: false
      },
      legend: {
          show: false
      }
  });

  //---------------------------------------

  $(document).on('click', '#btn-select-device', function(e){
    //execute ajax to pull in device data
    uilib.getThings();
    return false;
  });

  //---------------------------------------

  $(document).on('click', '.btn-device', function(e){
     // console.log('btn-device entered');
     var deviceAgg = $(this).attr('id');
     //extract the device id and put it into THING_ID
     var deviceId = extractKey(deviceAgg, 1);
     if(deviceId){
        THING_ID = deviceId;
        //all the other events have to cascade off this choice
        
        uilib.getSensorList(THING_ID);

        $('#current-thing').html(THING_ID);
        //reset the menu when we select something
        $('#btn-select-device').dropdown('toggle');
     }
     return false;
  });

}); //end document ready

//---------------------------------------
// HELPER FUNCTIONS
//---------------------------------------

function detectWhichSensor(input){
    var result=0;

    var found=SENSORS.indexOf(input);
    if(found>=0){
      result=found+1;
    }
    else{
      console.log('sensor not found: ' + input);
    }

    return result;
}

//---------------------------------------

function mapLocalToBleId(input){
    var result='';
    var localTemplate='{1}.json';
    if(input){
      result=localTemplate.apply(input);
    }

    return result;
}

//---------------------------------------

function buildStatsTable(data, title){
  var result='<tr>{1}</tr>';
  var body='';
  if(data && title){
    body+='<td class=\"title\">{1}</td>'.apply(title);
    body+='<td class=\"red\">{1} x</td>'.apply(data.x);
    body+='<td class=\"green\">{1} y</td>'.apply(data.y);
    body+='<td class=\"blue\">{1} z</td>'.apply(data.z);
  }
  return result.apply(body);
}

//---------------------------------------

function buildRangeTable(data, title){
  var result='<tr>{1}</tr>';
  var body='';
  if(data && title){
    body+='<td class=\"title\">{1}</td>'.apply(title);

    if(data.min == data.max){
        body+='<td class=\"green\">{1}</td>'.apply(data.min);
    }
    else{
       body+='<td class=\"blue\">{1} - {2}</td>'.apply(data.min, data.max);
    }
  }
  return result.apply(body);
}

//---------------------------------------

function displaySensorId(input){
  var result = input;
  if(input.length >= 10){
    result = input.substring(input.length-1-10);
  }

  return result;
}


//---------------------------------------

/**
* set the html of an element
* @param {object} elem - a jquery handle to the element
* @param {string} status - the html to paint
*/
function setElementStatus(elem, status){
    if(elem){
        elem.html(status);
    }
}

//---------------------------------------

/**
* check to see if it's null or empty, if it is print nothing
* @param {object} input - could be string or object
*/
function prettyPrintEmpty(input){
  if(input){
    return input;
  }

  return '';
}

//---------------------------------------

/**
* round to 2 significant digits
* @param {number} num - float to be rounded
*/
function roundToTwo(num) {
    return +(Math.round(num + "e+2")  + "e-2");
}