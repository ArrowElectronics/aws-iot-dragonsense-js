//---------------------------------------
// CONFIG FILE
//---------------------------------------

//debug locally
var DEBUG=false;

//control where ajax calls are made to
var DB_API = '__aws_api_gateway__';

//placeholder to store the thingId
//we go against the thing registry to see what things are available and store it here
var THING_ID = '';

var SENSORS=[];

//refresh times
//times are in ms. 1000 ms = 1 second
//NOTE: due to limitations of AWS, we can poll faster, but it will require rate throttling changes on Amazon side
var SENSOR_REFRESH_INTERVAL = 2000;