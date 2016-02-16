'use strict';

var path = require('path');

if (!String.prototype.startsWith) {
  String.prototype.startsWith = function(searchString, position) {
    position = position || 0;
    return this.indexOf(searchString, position) === position;
  };
}

/* The AWS SDK deployed on the nodes that execute the Lambda function can be used.  If you choose to use a custom
 * SDK, please note that the AWS SDK needs to be included as browserify is not able to minimize the AWS SDK
 * (see https://github.com/serverless/serverless/issues/130).  If you would like to include an AWS SDK, then
 * define the location of the AWS SDK and include it as a parameter to the src array.
 */
//var awsSdk = 'node_modules/aws-sdk/**';

// Remove the resultant dist/{resourceName}/ from the javascript file to bundle appropriately.
var lambdaRouter = function(filepath) {
  var returnValue = filepath;

  if (filepath.startsWith('dist/')) {
    filepath = path.basename(filepath);
  }

  return filepath;
};

module.exports = {
  observations: {
    src: [ '<%= uglify.observations.dest %>' ],
    dest: 'dist/observations/observations.zip',
    router: lambdaRouter
  },
  sensors: {
    src: [ '<%= uglify.sensors.dest %>' ],
    dest: 'dist/sensors/sensors.zip',
    router: lambdaRouter
  },
  things: {
    src: [ '<%= uglify.things.dest %>' ],
    dest: 'dist/things/things.zip',
    router: lambdaRouter
  }
};