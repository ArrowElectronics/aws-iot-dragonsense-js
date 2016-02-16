'use strict';

module.exports = {
  all: {
    options: {
      mode: 755
    }
  },
  test: {
    options: {
      create: [ 'logs' ]
    }
  },
  package: {
    options: {
      create: [ 'dist' ]
    }
  }
};
