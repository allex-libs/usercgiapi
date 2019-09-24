var superagent = require('superagent');

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
    return setGlobal(options.slug, allex_readsinkstatelib(User, options.slug));
  });
  it(options.slug, function () {
    console.log(options.slug, getGlobal(options.slug));
  });
  uploadIt(options.slug, __dirname+'/'+options.filepath, options.uploadfields);
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
    return setGlobal('User', letMeIn(null, {__remote__username: username, __remote__password: '123456'}));
  });
  /*
  */
  uploadJob({
    slug: 'uploadUniqueURL',
    filepath: 'samplefiles/blah.txt',
    uploadfields: {why: 'because'}
  });
  uploadJob({
    slug: 'uploadContentsURL',
    filepath: 'samplefiles/blah.json',
    uploadfields: {why: 'melikeit.json'}
  });

  /*
  uploadJob({
    slug: 'uploadURL',
    filepath: 'samplefiles/blah.txt',
    uploadfields: {why: 'melikeit'}
  });
  it('Check for timestamp of uploaded file', function () {
    //return qlib.promise2console(allex_filesystemjobslib.entityModifiedAt([__dirname, '..', '..', 'files', 'blah.txt']), 'entityModifiedAt');
    return expect(allex_filesystemjobslib.entityModifiedAt([__dirname, '..', '..', 'files', 'blah.txt'])).to.eventually.be.above(Date.now()-1000);
  });
  */

  it('Wait for downloadURL', function () {
    return setGlobal('downloadURL', allex_readsinkstatelib(User, 'downloadURL'));
  });
  it('Looky', function () {
    console.log('downloadURL', downloadURL);
  });
  downloadIt('downloadURL', {what: 'that'});
  /*
  */

  it('Destroy User sink', function () {
    User.destroy();
  });
  it('Wait a bit', function (done) {
    lib.runNext(done, lib.intervals.Second);
  });
}

describe('Basic Test', function () {
  loadMochaIntegration('allex_httpservice');
  loadMochaIntegration('allex_entrypointservice');
  loadClientSide(['allex:filesystemjobs:lib', 'allex:readsinkstate:lib']);
  it('Create Requester', function () {
    return setGlobal('Requester', new HTTPRequester('http', '127.0.0.1', 8008, 'GET', {debug:true}));
  });
  for (var i=0; i<20; i++) {
    testCycle(lib.uid());
  }
  /*
  */
});
