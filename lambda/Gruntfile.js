'use strict';

var deploy = require('admin/lambda');

function createMultiTasks(result, multiTasks, target) {
  multiTasks.forEach(function(task) {
    result.push(task.concat(':', target));
  });
}

module.exports = function(grunt) {
  require('load-grunt-config')(grunt);

  grunt.registerTask('unitTest', 'Unit tests', [ 'mkdir:test', 'mochaTest:unit' ]);

  grunt.registerMultiTask('pkg', 'Package the lambda functions', function() {
    var packageTasks = [ 'browserify', 'uglify', 'zip' ];

    var multiTasks = [ 'mkdir:package' ];
    createMultiTasks(multiTasks, packageTasks, this.target);

    grunt.task.run(multiTasks);
  });

  grunt.registerMultiTask('create', 'Package and create a lambda function.', function() {
    var createTasks = [ 'pkg', 'createMultiTask' ];

    var multiTasks = [];
    createMultiTasks(multiTasks, createTasks, this.target);

    grunt.task.run(multiTasks);
  });

  grunt.registerMultiTask('createMultiTask', 'Create a lambda function', function() {
    grunt.task.requires('pkg:' + this.target);

    deploy.create(this.target, this.data, this.async());
  });

  grunt.registerMultiTask('update', 'Package and update a lambda function.', function() {
    var updateTasks = [ 'pkg', 'updateMultiTask' ];

    var multiTasks = [];
    createMultiTasks(multiTasks, updateTasks, this.target);

    grunt.task.run(multiTasks);
  });

  grunt.registerMultiTask('updateMultiTask', 'Update a lambda function', function() {
    grunt.task.requires('pkg:' + this.target);

    deploy.update(this.target, this.data, this.async());
  });

  grunt.registerMultiTask('delete', 'Delete a lambda function', function() {
    deploy.del(this.target, this.async());
  });
};
