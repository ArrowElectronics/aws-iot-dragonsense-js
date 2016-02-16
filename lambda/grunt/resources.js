'use strict';

/* The tasks are relatively the same and while not technically correct, the approach will prevent
 * unnecessary maintenance.
 */
module.exports = {
  observations: '<%= zip.observations.dest %>',
  sensors: '<%= zip.sensors.dest %>',
  things: '<%= zip.things.dest %>'
};