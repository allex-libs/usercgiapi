var superagent = require('superagent');

var _EntryPointAddress = '127.0.0.1',
  _EntryPointPort = 8008;

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
  this.startListeningOnFileJobsDone(sink.state, 'uploadURL');
  this.startListeningOnFileJobsDone(sink.state, 'uploadUniqueURL');
  this.startListeningOnFileJobsDone(sink.state, 'uploadContentsURL');
  this.startListeningOnFileJobsDone(sink.state, 'downloadURL');
}
ListenerKlass.prototype.destroy = function () {
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
    this.timeout(1e5);
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
    this.timeout(1e5);
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
    this.timeout(1e5);
    return setGlobal(options.slug, allex_readsinkstatelib(User, options.slug));
  });
  it(options.slug, function () {
    console.log(options.slug, getGlobal(options.slug));
  });
  uploadIt(options.slug, __dirname+'/'+options.filepath, options.uploadfields);
  it('Wait for '+options.slug+' ack', function () {
    this.timeout(3e5);
    return expect(Listener.waitFor(options.slug)).to.eventually.equal(true);
  });
}

function testCycle (username) {
  it('Ask for user "'+username+'"', function () {
    this.timeout(1e5);
    return setGlobal('blahExists', Requester.request('usernameExists', {username: username}).then(qlib.resultpropertyreturner('exists')));
  });
  it('If not registered, register', function () {
    this.timeout(1e5);
    if (!blahExists) {
      return Requester.request('register', {username: username, password: '123456', role: 'user'});
    }
  });
  it('Assure that user "'+username+'" exists now', function () {
    this.timeout(1e5);
    return expect(Requester.request('usernameExists', {username: username}).then(qlib.resultpropertyreturner('exists'))).to.eventually.equal(true);
  });
  it('Let Me In', function () {
    this.timeout(1e5);
    return setGlobal('User', letMeInOnAddressAndPort(_EntryPointAddress, _EntryPointPort, {__remote__username: username, __remote__password: '123456'}));
  });
  it('Set Listener', function () {
    setGlobal('Listener', new ListenerKlass(User));
  });
  uploadJob({
    slug: 'uploadUniqueURL',
    filepath: 'samplefiles/njah.txt',
    uploadfields: {why: 'because'}
  });
  /*
  it('Wait a bit', function (done) {
    lib.runNext(done, 100+Math.round(Math.random()*lib.intervals.Second));
  });
  */
  uploadJob({
    slug: 'uploadContentsURL',
    filepath: 'samplefiles/blah.json',
    uploadfields: {why: 'melikeit.json'}
  });
  /*
  it('Wait a bit', function (done) {
    lib.runNext(done, 100+Math.round(Math.random()*lib.intervals.Second));
  });
  */
  uploadJob({
    slug: 'uploadURL',
    filepath: 'samplefiles/blah.txt',
    uploadfields: {why: 'melikeit'}
  });
  it('Check for timestamp of uploaded file', function () {
    //return qlib.promise2console(allex_filesystemjobslib.entityModifiedAt([__dirname, '..', '..', 'files', 'blah.txt']), 'entityModifiedAt');
    return expect(allex_filesystemjobslib.entityModifiedAt([__dirname, '..', '..', 'files', 'blah.txt'])).to.eventually.be.above(Date.now()-1000);
  });
  /*
  */

  it('Wait for downloadURL', function () {
    return setGlobal('downloadURL', allex_readsinkstatelib(User, 'downloadURL'));
  });
  it('Looky', function () {
    console.log('downloadURL', downloadURL);
  });
  downloadIt('downloadURL', {what: 'that'});
  it('Wait for downloadURL ack', function () {
    this.timeout(3e5);
    return expect(Listener.waitFor('downloadURL')).to.eventually.equal(true);
  });
  /*
  */

  /*
  it('Wait a longer bit', function (done) {
    lib.runNext(done, 5+Math.round(Math.random()*lib.intervals.Second));
  });
  */
  it('Destroy User sink', function () {
    User.destroy();
  });
}

describe('Basic Test', function () {
  //tryModuleName('test__usercgi_usersservice', ['..', '..', 'src']);
  loadMochaIntegration('allex_httpservice');
  loadMochaIntegration('allex_entrypointservice');
  loadClientSide(['allex:filesystemjobs:lib', 'allex:readsinkstate:lib', 'allex:entrypoint']);
  it('Create Requester', function () {
    return setGlobal('Requester', new HTTPRequester('http', _EntryPointAddress, _EntryPointPort, 'GET', {debug:true}));
  });
  for (var i=0; i<50; i++) {
    testCycle(lib.uid());
  }
  /*
  */
});
