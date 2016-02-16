'use strict';

module.exports = {
  options: {
    jshintrc: '.jshintrc',
    reporter: require('jshint-stylish')
  },
  lib: [
    'index.js',
    'lib/**/*.js'
  ],
  all: [
    'Gruntfile.js',
    'grunt/*.js'
  ],
  test: {
    options: {
      jshintrc: 'test/.jshintrc'
    },
    src: ['test/{,*/}*.js']
  }
};
