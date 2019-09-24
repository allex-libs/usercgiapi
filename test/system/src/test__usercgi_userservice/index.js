function createServicePack(execlib) {
  'use strict';
  return {
    service: {
      dependencies: ['allex:user', 'allex:usercgiapi:lib', 'allex:httpresponsefile:lib']
    },
    sinkmap: {
      dependencies: ['allex:user']
    }, /*
    tasks: {
      dependencies: []
    }
    */
  }
}

module.exports = createServicePack;
