function createUserService(execlib, ParentService, usercgiapilib, httpresponsefilelib) {
  'use strict';

  var lib = execlib.lib,
    PlainTextFile = httpresponsefilelib.PlainTextFile;

  function MyTextFile (filename, destroyables) {
    PlainTextFile.call(this, filename, destroyables);
    this.called = false;
  }
  lib.inherit(MyTextFile, PlainTextFile);
  MyTextFile.prototype.destroy = function () {
    this.called = null;
    PlainTextFile.prototype.destroy.call(this);
  };
  MyTextFile.prototype.getPayload = function () {
    if (this.called) {
      this.destroy();
      return null;
    }
    this.called = true;
    return 'Blah';
  };

  function factoryCreator(parentFactory) {
    return {
      'service': require('./users/serviceusercreator')(execlib, parentFactory.get('service')),
      'user': require('./users/usercreator')(execlib, parentFactory.get('user')) 
    };
  }

  var cnt = 0, maxcnt = 0;

  function UserService(prophash) {
    cnt++;
    if (cnt>maxcnt) {
      maxcnt = cnt;
    }
    ParentService.call(this, prophash);
    this.uploadHandler = new usercgiapilib.UploadHandler(this, 'CGI', 'Files', null, ['why'], 'uploadURL', this.onUpload.bind(this));
    this.uploadHandler.activate();
    this.uploadUniqueHandler = new usercgiapilib.UploadUniqueHandler(this, 'CGI', 'Files', null, ['why'], 'uploadUniqueURL', this.onUploadUnique.bind(this));
    this.uploadUniqueHandler.activate();
    this.uploadContentsHandler = new usercgiapilib.UploadContentsHandler(this, 'CGI', 'allex_jsonparser', null, ['why'], 'uploadContentsURL', this.onUploadContents.bind(this));
    this.uploadContentsHandler.activate();
    this.downloadHandler = new usercgiapilib.DownloadHandler(this, 'CGI', 'downloadURL', this.onDownload.bind(this));
    this.downloadHandler.activate();
  }
  
  ParentService.inherit(UserService, factoryCreator, void 0, {
    local: require('./localsinkinfo'),
    remote: require('./remotesinkinfo')
  });
  
  UserService.prototype.__cleanUp = function() {
    cnt--;
    console.log(this.name, 'going down', 'max was', maxcnt, cnt, 'left');
    if (this.downloadHandler) {
      this.downloadHandler.destroy();
    }
    this.downloadHandler = null;
    if (this.uploadContentsHandler) {
      this.uploadContentsHandler.destroy();
    }
    this.uploadContentsHandler = null;
    if (this.uploadUniqueHandler) {
      this.uploadUniqueHandler.destroy();
    }
    this.uploadUniqueHandler = null;
    if (this.uploadHandler) {
      this.uploadHandler.destroy();
    }
    this.uploadHandler = null;
    ParentService.prototype.__cleanUp.call(this);
  };

  UserService.prototype.onUpload = function () {
    //console.log('onUpload', arguments);
  };
  
  UserService.prototype.onUploadUnique = function () {
    //console.log('onUploadUnique', arguments);
  };
  
  UserService.prototype.onUploadContents = function () {
    //console.log('onUploadContents', arguments);
  };

  UserService.prototype.onDownload = function (taskobj, cgiitem) {
    //console.log('onDownload taskobj', Object.keys(taskobj));
    //console.log('onDownload data', cgiitem ? cgiitem.data : 'none');
    return new MyTextFile('blah.txt', [this, taskobj.sink]);
  };
  
  return UserService;
}

module.exports = createUserService;
