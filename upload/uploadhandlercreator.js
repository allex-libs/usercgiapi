function createUploadHandler(execlib, mylib) {
  'use strict';
  var lib = execlib.lib,
    UploadHandlerBase = mylib.UploadHandlerBase;

  /*
    service: UserService this Handler handles for
    cgiservicename: the name of the CGIService
    targetservicename: the name of the target service files should be uploaded to
    boundfields: hash, name/value pairs
    neededfields: array, names of needed fields
    uploadslugname: once the upload is negotiated, the upload slug will be set on `service` state under uploadslugname
    uploadcb: optional, if exists it will be called. Alternative is to override UploadHandler's onUploadSuccess
    secure: if true-ish, http will be replaced with https
  */

  function UploadHandler (service, cgiservicename, targetservicename, boundfields, neededfields, uploadslugname, uploadcb, secure) {
    UploadHandlerBase.call(this, service, cgiservicename, boundfields, neededfields, uploadslugname, uploadcb, secure);
    this.targetservicename = targetservicename;
  }
  lib.inherit(UploadHandler, UploadHandlerBase);
  UploadHandler.prototype.destroy = function () {
    this.targetservicename = null;
    UploadHandlerBase.prototype.destroy.call(this);
  };
  UploadHandler.prototype.findAndRunTaskName = 'registerUpload';
  UploadHandler.prototype.findAndRunTaskPropertyHash = function (defer) {
    var ret = UploadHandlerBase.prototype.findAndRunTaskPropertyHash.call(this, defer);
    ret.targetsinkname = this.targetservicename;
    ret.identityattargetsink = {
      name: this.service.name,
      role: 'user'
    };
    return ret;
  };

  mylib.UploadHandler = UploadHandler;
}

module.exports = createUploadHandler;
