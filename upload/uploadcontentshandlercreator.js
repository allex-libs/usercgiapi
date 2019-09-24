function createUploadContentsHandler(execlib, mylib) {
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
    uploadcb: optional, if exists it will be called. Alternative is to override UploadContentsHandler's onUploadSuccess
    secure: if true-ish, http will be replaced with https
  */

  function UploadContentsHandler (service, cgiservicename, parsermodulename, boundfields, neededfields, uploadslugname, uploadcb, secure) {
    UploadHandlerBase.call(this, service, cgiservicename, boundfields, neededfields, uploadslugname, uploadcb, secure);
    this.parsermodulename = parsermodulename;
  }
  lib.inherit(UploadContentsHandler, UploadHandlerBase);
  UploadContentsHandler.prototype.destroy = function () {
    this.parsermodulename = null;
    UploadHandlerBase.prototype.destroy.call(this);
  };
  UploadContentsHandler.prototype.findAndRunTaskName = 'registerUploadContents';
  UploadContentsHandler.prototype.findAndRunTaskPropertyHash = function (defer) {
    var ret = UploadHandlerBase.prototype.findAndRunTaskPropertyHash.call(this, defer);
    ret.parsermodulename = this.parsermodulename;
    return ret;
  };

  mylib.UploadContentsHandler = UploadContentsHandler;
}

module.exports = createUploadContentsHandler;
