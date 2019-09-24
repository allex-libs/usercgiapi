function createServicePack(execlib) {
  'use strict';
  return {
    service: {
      dependencies: ['allex:generichumanuserdata']
    },
    sinkmap: {
      dependencies: ['allex:generichumanuserdata']
    }, /*
    tasks: {
      dependencies: []
    }
    */
  }
}

module.exports = createServicePack;
