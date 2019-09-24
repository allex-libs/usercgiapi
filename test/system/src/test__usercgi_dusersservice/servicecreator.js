function createDUsersService(execlib, ParentService) {
  'use strict';
  var dataSuite = execlib.dataSuite;

  function factoryCreator(parentFactory) {
    return {
      'service': require('./users/serviceusercreator')(execlib, parentFactory.get('service')),
      'user': require('./users/usercreator')(execlib, parentFactory.get('user')),
      'crypto': parentFactory.get('crypto') 
    };
  }

  function DUsersService(prophash) {
    ParentService.call(this, prophash);
  }
  
  ParentService.inherit(DUsersService, factoryCreator, require('./storagedescriptor'));
  
  DUsersService.prototype.__cleanUp = function() {
    ParentService.prototype.__cleanUp.call(this);
  };
  DUsersService.prototype.createStorage = function(storagedescriptor) {
    return ParentService.prototype.createStorage.call(this, storagedescriptor);
  };
  return DUsersService;
}

module.exports = createDUsersService;
