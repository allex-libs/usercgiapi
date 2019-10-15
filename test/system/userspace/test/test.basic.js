var superagent = require('superagent');

var _EntryPointAddress = '192.168.1.204',
  _EntryPointPort = 8008,
  _timeoutUnit = 1e5;

function ListenerKlass (sink) {
  this.sink = sink;
  if (!(sink && sink.destroyed)) {
    throw new Error('sink is not alive');
  }
  this.stateTask = taskRegistry.run('materializeState', {
    sink: this.sink
  });
  this.defers = {
    uploadURL: q.defer(),
    uploadUniqueURL: q.defer(),
    uploadContentsURL: q.defer(),
    downloadURL: q.defer()
  };
  this.sinkDestroyedListener = this.sink.destroyed.attach(this.destroy.bind(this));
  this.startListeningOnFileJobsDone(sink.state, 'uploadURL');
  this.startListeningOnFileJobsDone(sink.state, 'uploadUniqueURL');
  this.startListeningOnFileJobsDone(sink.state, 'uploadContentsURL');
  this.startListeningOnFileJobsDone(sink.state, 'downloadURL');
}
ListenerKlass.prototype.destroy = function () {
  if (this.sinkDestroyedListener) {
    this.sinkDestroyedListener.destroy();
  }
  this.sinkDestroyedListener = null;
  this.defers = null;
  if (this.stateTask) {
    this.stateTask.destroy();
  }
  this.stateTask = null;
  this.sink = null;
};
ListenerKlass.prototype.waitFor = function (waitname) {
  var d = this.defers[waitname];
  if (!d) {
    return q.reject(new Error(waitname+' is not a wait name'));
  }
  return d.promise;
};
ListenerKlass.prototype.startListeningOnFileJobsDone = function (fjd, waitname) {
  var d = this.defers[waitname];
  if (!d) {
    throw (new Error(waitname+' is not a wait name'));
  }
  fjd.data.listenFor(waitname+'Done', d.resolve.bind(d), true);
};

function fielder (agent, fieldval, fieldname) {
  agent.field(fieldname, fieldval);
}

function uploadIt (uploadurlname, filepath, fields) {
  it('Upload '+filepath, function (done) {
    this.timeout(_timeoutUnit);
    var uploadurl = getGlobal(uploadurlname);
    if (!uploadurl) {
      done(new Error('There is no url at global '+uploadurlname));
      return;
    }
    uploadurlname = null;
    var agent = superagent.agent(), req, _req;
    req = agent
      .post(uploadurl)
      .set('Content-Type', false)
      .set('Process-Data', false);
    _req = req;
    lib.traverseShallow(fields, fielder.bind(null, _req));
    _req = null;
    req
      .attach('file', filepath)
      .then(
        result => {
          //console.log('result', result);
          done();
        },
        done
      );
    filepath = null;
    fields = null;
  });
}

function downloadIt (downloadurlname, fields) {
  it('Download', function (done) {
    this.timeout(_timeoutUnit);
    var downloadurl = getGlobal(downloadurlname);
    if (!downloadurl) {
      done(new Error('There is no url at global '+downloadurlname));
      return;
    }
    var agent = superagent.agent(), req, _req;
    req = agent.post(downloadurl);
    req.set('Content-Type', 'application/json');
    req.send(fields);
    req.then(
      result => {
        //console.log('result', result);
        if (result.text==='Blah') {
          done();
          return;
        }
        done(new Error('Expected the received text to be "Blah", but got '+result.text));
      }
    );
    fields = null;
  });
};

function uploadJob (options) {
  it('Wait for '+options.slug, function () {
    this.timeout(_timeoutUnit);
    return setGlobal(options.slug, allex_readsinkstatelib(getGlobal('User'+options.index), options.slug));
  });
  it(options.slug, function () {
    console.log(options.slug, getGlobal(options.slug));
  });
  uploadIt(options.slug, __dirname+'/'+options.filepath, options.uploadfields);
  it('Wait for '+options.slug+' ack', function () {
    this.timeout(_timeoutUnit);
    return expect(getGlobal('Listener'+options.index).waitFor(options.slug)).to.eventually.equal(true);
  });
}

function testCycle (count) {
  var oi, usernames=new Array(count);
  for (oi=0; oi<count; oi++) {
    usernames[oi] = lib.uid();
  }
  for (oi=0; oi<count; oi++) {
    (function (index) {
      it('Ask for user "'+usernames[oi]+'"', function () {
        this.timeout(_timeoutUnit);
        return setGlobal('blahExists', Requester.request('usernameExists', {username: usernames[index]}).then(qlib.resultpropertyreturner('exists')));
      });
    })(oi);
  }
  for (oi=0; oi<count; oi++) {
    (function (index) {
      it('If not registered, register', function () {
        this.timeout(_timeoutUnit);
        if (!blahExists) {
          return Requester.request('register', {username: usernames[index], password: '123456', role: 'user'});
        }
      });
    })(oi);
  }
  for (oi=0; oi<count; oi++) {
    (function (index) {
      it('Assure that user "'+usernames[index]+'" exists now', function () {
        this.timeout(_timeoutUnit);
        return expect(Requester.request('usernameExists', {username: usernames[index]}).then(qlib.resultpropertyreturner('exists'))).to.eventually.equal(true);
      });
    })(oi);
  }
  for (oi=0; oi<count; oi++) {
    (function (index) {
      it('Let Me In', function () {
        this.timeout(_timeoutUnit);
        return setGlobal('User'+index, letMeInOnAddressAndPort(_EntryPointAddress, _EntryPointPort, {__remote__username: usernames[index], __remote__password: '123456'})).then(
          sink => {taskRegistry.run('materializeState', {sink: sink});}
        );
      });
    })(oi);
  }
  for (oi=0; oi<count; oi++) {
    (function (index) {
      it('Set Listener', function () {
        setGlobal('Listener'+index, new ListenerKlass(getGlobal('User'+index)));
      });
    })(oi);
  }
  for (oi=0; oi<count; oi++) {
    uploadJob({
      index: oi,
      slug: 'uploadUniqueURL',
      filepath: 'samplefiles/njah.txt',
      uploadfields: {why: 'because'}
    });
    /*
    it('Wait a bit', function (done) {
      lib.runNext(done, 100+Math.round(Math.random()*lib.intervals.Second));
    });
    */
  }
  for (oi=0; oi<count; oi++) {
    uploadJob({
      index: oi,
      slug: 'uploadContentsURL',
      filepath: 'samplefiles/blah.json',
      uploadfields: {why: 'melikeit.json'}
    });
    /*
    it('Wait a bit', function (done) {
      lib.runNext(done, 100+Math.round(Math.random()*lib.intervals.Second));
    });
    */
  }
  for (oi=0; oi<count; oi++) {
    uploadJob({
      index: oi,
      slug: 'uploadURL',
      filepath: 'samplefiles/blah.txt',
      uploadfields: {why: 'melikeit'}
    });
    /*
    it('Check for timestamp of uploaded file', function () {
      //return qlib.promise2console(allex_filesystemjobslib.entityModifiedAt([__dirname, '..', '..', 'files', 'blah.txt']), 'entityModifiedAt');
      return expect(allex_filesystemjobslib.entityModifiedAt([__dirname, '..', '..', 'files', 'blah.txt'])).to.eventually.be.above(Date.now()-1000);
    });
    */
  }
  for (oi=0; oi<count; oi++) {
    (function (index) {
      it('Wait for downloadURL', function () {
        return setGlobal('downloadURL'+index, allex_readsinkstatelib(getGlobal('User'+index), 'downloadURL'));
      });
    })(oi);
  }
  for (oi=0; oi<count; oi++) {
    (function (index) {
      it('Looky', function () {
        console.log('downloadURL'+index, getGlobal('downloadURL'+index));
      });
    })(oi);
  }
  for (oi=0; oi<count; oi++) {
    (function (index) {
      downloadIt('downloadURL'+index, {what: 'that'});
      it('Wait for downloadURL ack', function () {
        this.timeout(_timeoutUnit);
        return expect(getGlobal('Listener'+index).waitFor('downloadURL')).to.eventually.equal(true);
      });
    })(oi);
    /*
    */
  }

  for (oi=0; oi<count; oi++) {
    (function (index) {
      /*
      it('Wait a longer bit', function (done) {
        lib.runNext(done, 5+Math.round(Math.random()*lib.intervals.Second));
      });
      */
      it('Destroy User sink', function () {
        getGlobal('User'+index).destroy();
      });
    })(oi);
  }
}

describe('Basic Test', function () {
  //tryModuleName('test__usercgi_usersservice', ['..', '..', 'src']);
  loadMochaIntegration('allex_httpservice');
  loadMochaIntegration('allex_entrypointservice');
  loadClientSide(['allex:filesystemjobs:lib', 'allex:readsinkstate:lib', 'allex:entrypoint']);
  it('Create Requester', function () {
    return setGlobal('Requester', new HTTPRequester('http', _EntryPointAddress, _EntryPointPort, 'GET', {debug:true}));
  });
  testCycle(100);
  /*
  */
});
