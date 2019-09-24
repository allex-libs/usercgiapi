function createDownloadHandler(execlib, SinkHolderMixin, mylib) {
  'use strict';
  var lib = execlib.lib,
    q = lib.q,
    execSuite = execlib.execSuite,
    taskRegistry = execSuite.taskRegistry;

  function DownloadHandler (service, cgiservicename, downloadslugname, downloadcb, secure) {
    SinkHolderMixin.call(this);
    this.service = service;
    this.cgiservicename = cgiservicename;
    this.downloadslugname = downloadslugname;
    this.downloadcb = downloadcb;
    this.secure = secure;
  };
  SinkHolderMixin.addMethods(DownloadHandler);
  DownloadHandler.prototype.destroy = function () {
    this.secure = null;
    this.downloadcb = null;
    this.downloadslugname = null;
    this.cgiservicename = null;
    this.service = null;
    SinkHolderMixin.prototype.destroy.call(this);
  };
  DownloadHandler.prototype.acquireSink = function () {
    var d = q.defer();
    taskRegistry.run('findAndRun', {
      program: {
        continuous: true,
        sinkname: this.cgiservicename,
        identity: {name: 'user', role: 'user'},
        task: {
          name: 'registerDownload', 
          propertyhash: {
            ipaddress: 'fill yourself',
            onEventId: {
              'bind yourself': this.onDownloadId.bind(this, d)
            },
            onDownloadStarted: {
               'bind yourself': this.onDownloadStarted.bind(this)
            }
          }
        }
      }
    });
    return d.promise;
  };
  DownloadHandler.prototype.onDownloadId = function (defer, findandruntask, originalprophash, id, cgiaddress, cgiport) {
    findandruntask.destroy();
    var cgisink = originalprophash.sink, proto = 'http';
    if (this.secure || cgiport === 443) {
      proto += 's';
    }
    if (!cgisink){
      this.service.state.remove(this.downloadslugname);
      defer.reject(new lib.Error('NO_SINK'));
      return;
    }
    //console.log('setting', this.downloadslugname, 'to', proto+'://'+cgiaddress+':'+cgiport+'/_'+id);
    this.service.state.set(this.downloadslugname, proto+'://'+cgiaddress+':'+cgiport+'/_'+id);
    defer.resolve(cgisink);
  };
  DownloadHandler.prototype.onDownloadStarted = function (originalprophash, findandruntask, cgievent) {
    if (this.downloadcb) {
      return this.downloadcb(findandruntask, cgievent);
    }
  };


  mylib.DownloadHandler = DownloadHandler;
}

module.exports = createDownloadHandler;
