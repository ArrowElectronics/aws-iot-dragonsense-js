'use strict';

module.exports = {
  observations: {
    src: [ '<%= browserify.observations.dest %>' ],
    dest: 'dist/observations/observations.js'
  },
  sensors: {
    src: [ '<%= browserify.sensors.dest %>' ],
    dest: 'dist/sensors/sensors.js'
  },
  things: {
    src: [ '<%= browserify.things.dest %>' ],
    dest: 'dist/things/things.js'
  }
};