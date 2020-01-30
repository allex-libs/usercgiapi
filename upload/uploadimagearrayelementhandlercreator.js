function createUploadImageArrayElementHandler(execlib, mylib) {
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
    uploadcb: optional, if exists it will be called. Alternative is to override UploadImageArrayElementHandler's onUploadSuccess
    secure: if true-ish, http will be replaced with https
  */

  function UploadImageArrayElementHandler (service, cgiservicename, targetservicename, boundfields, neededfields, imagesizes, uploadslugname, uploadcb, secure) {
    UploadHandlerBase.call(this, service, cgiservicename, boundfields, ['imageIndex', 'x', 'y', 'width', 'height', 'rotate', 'scaleX', 'scaleY'].concat(neededfields||[]), uploadslugname, uploadcb, secure);
    this.targetservicename = targetservicename;
    this.imagesizes = imagesizes;
  }
  lib.inherit(UploadImageArrayElementHandler, UploadHandlerBase);
  UploadImageArrayElementHandler.prototype.destroy = function () {
    this.imagesizes = null;
    this.targetservicename = null;
    UploadHandlerBase.prototype.destroy.call(this);
  };
  UploadImageArrayElementHandler.prototype.findAndRunTaskName = 'registerUploadImageArrayElement';
  UploadImageArrayElementHandler.prototype.findAndRunTaskPropertyHash = function (defer) {
    var ret = UploadHandlerBase.prototype.findAndRunTaskPropertyHash.call(this, defer);
    ret.targetsinkname = this.targetservicename;
    ret.identityattargetsink = {
      name: this.service.name,
      role: 'user'
    };
    ret.imagesizes = this.imagesizes;
    return ret;
  };

  mylib.UploadImageArrayElementHandler = UploadImageArrayElementHandler;
}

module.exports = createUploadImageArrayElementHandler;
