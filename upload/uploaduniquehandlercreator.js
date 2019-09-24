function createUploadUniqueHandler(execlib, mylib) {
  'use strict';
  var lib = execlib.lib,
    UploadHandler = mylib.UploadHandler;

  /*
    service: UserService this Handler handles for
    cgiservicename: the name of the CGIService
    targetservicename: the name of the target service files should be uploaded to
    boundfields: hash, name/value pairs
    neededfields: array, names of needed fields
    uploadslugname: once the upload is negotiated, the upload slug will be set on `service` state under uploadslugname
    uploadcb: optional, if exists it will be called. Alternative is to override UploadUniqueHandler's onUploadSuccess
    secure: if true-ish, http will be replaced with https
  */

  function UploadUniqueHandler (service, cgiservicename, targetservicename, boundfields, neededfields, uploadslugname, uploadcb, secure) {
    UploadHandler.call(this, service, cgiservicename, targetservicename, boundfields, neededfields, uploadslugname, uploadcb, secure);
  }
  lib.inherit(UploadUniqueHandler, UploadHandler);
  UploadUniqueHandler.prototype.findAndRunTaskName = 'registerUploadUnique';


  mylib.UploadUniqueHandler = UploadUniqueHandler;
}

module.exports = createUploadUniqueHandler;
