'use strict';

module.exports = {
  options: {
    browserifyOptions: {
      standalone: 'lambda',
      browserField: false,
      builtins: false,
      commondir: false,
      detectGlobals: true,
      insertGlobalVars: {
        // Handle process https://github.com/substack/node-browserify/issues/1277
        process: function() {
        }
      }
    },
    exclude: [ 'aws-sdk' ]
  },
  observations: {
    src: [ 'lib/lambda/observations/handler.js' ],
    dest: 'dist/observations/observations.bundled.js'
  },
  sensors: {
    src: [ 'lib/lambda/sensors/handler.js' ],
    dest: 'dist/sensors/sensors.bundled.js'
  },
  things: {
    src: [ 'lib/lambda/things/handler.js' ],
    dest: 'dist/things/things.bundled.js'
  }
};
