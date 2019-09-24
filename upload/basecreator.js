function createUploadHandlerBase (execlib, SinkHolderMixin, mylib) {
  'use strict';

  var lib = execlib.lib,
    q = lib.q,
    execSuite = execlib.execSuite,
    taskRegistry = execSuite.taskRegistry;

  function UploadHandlerBase (service, cgiservicename, boundfields, neededfields, uploadslugname, uploadcb, secure) {
    SinkHolderMixin.call(this);
    this.service = service;
    this.cgiservicename = cgiservicename;
    this.boundfields = boundfields;
    this.neededfields = neededfields;
    this.uploadslugname = uploadslugname;
    this.uploadcb = uploadcb;
    this.secure = secure;
  }
  SinkHolderMixin.addMethods(UploadHandlerBase);
  UploadHandlerBase.prototype.destroy = function () {
    this.secure = null;
    this.uploadcb = null;
    this.uploadslugname = null;
    this.neededfields = null;
    this.boundfields = null;
    this.cgiservicename = null;
    this.service = null;
    SinkHolderMixin.prototype.destroy.call(this);
  };
  UploadHandlerBase.prototype.acquireSink = function () {
    var d = q.defer(), ret = d.promise;
    taskRegistry.run('findAndRun',{
      program: {
        sinkname: this.cgiservicename,
        identity: {name: 'user', role: 'user'},
        task: {
          name: this.findAndRunTaskName,
          propertyhash: this.findAndRunTaskPropertyHash(d)
        }
      }
    });
    d = null;
    return ret;
  };
  UploadHandlerBase.prototype.onUploadId = function (defer, findandruntask, originalprophash, id, cgiaddress, cgiport) {
    console.log(this.findAndRunTaskName, 'onUploadId', id, cgiaddress, cgiport);
    findandruntask.destroy();
    var cgisink = originalprophash.sink, proto = 'http';
    if (this.secure || cgiport === 443) {
      proto += 's';
    }
    if(!cgisink){
      defer.reject(new lib.Error('NO_SINK'));
      return;
    }
    //console.log('setting', this.uploadslugname, 'to', proto+'://'+cgiaddress+':'+cgiport+'/_'+id);
    this.service.set(this.uploadslugname, proto+'://'+cgiaddress+':'+cgiport+'/_'+id);
    defer.resolve(cgisink);
  };
  UploadHandlerBase.prototype.onUploadDone = function (doneobj) {
    if (!doneobj.success) {
      return;
    }
    if (this.uploadcb) {
      this.uploadcb(doneobj);
    }
    this.onUploadSuccess(doneobj);
  };
  UploadHandlerBase.prototype.onUploadSuccess = lib.dummyFunc;
  UploadHandlerBase.prototype.deactivate = function () {
    if (this.service && this.service.state) {
      this.service.state.remove(this.uploadslugname);
    }
    return SinkHandler.prototype.deactivate.call(this);
  };
  UploadHandlerBase.prototype.findAndRunTaskPropertyHash = function (defer) {
    return {
      boundfields: this.boundfields,
      neededfields: this.neededfields,
      onEventId: {
        'bind yourself': this.onUploadId.bind(this, defer)
      },
      onUploadDone: this.onUploadDone.bind(this),
      ipaddress: 'fill yourself'
    };
  };

  mylib.UploadHandlerBase = UploadHandlerBase;
}

module.exports = createUploadHandlerBase;
