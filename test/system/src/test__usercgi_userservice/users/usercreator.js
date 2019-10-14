function createUser(execlib, ParentUser) {
  'use strict';
  if (!ParentUser) {
    ParentUser = execlib.execSuite.ServicePack.Service.prototype.userFactory.get('user');
  }

  function User(prophash) {
    ParentUser.call(this, prophash);
  }
  
  var localsinkinfo = require('../localsinkinfo'),
    remotesinkinfo = require('../remotesinkinfo'),
    visiblefields = [];
  localsinkinfo.forEach(function(localsink){
    visiblefields.push('have'+localsink.name);
  });
  remotesinkinfo.forEach(function(remotesink){
    visiblefields.push('have'+execlib.execSuite.userServiceSuite.nameOfRemoteSinkDescriptor(remotesink));
  });
  ParentUser.inherit(User, require('../methoddescriptors/user'), visiblefields.concat([
    'uploadURL',
    'uploadUniqueURL',
    'uploadContentsURL',
    'downloadURL',
    'uploadURLDone',
    'uploadUniqueURLDone',
    'uploadContentsURLDone',
    'downloadURLDone'
    /*visible state fields here*/]));
  
    visiblefields = null;
  User.prototype.__cleanUp = function () {
    ParentUser.prototype.__cleanUp.call(this);
  };

  return User;
}

module.exports = createUser;
