function createLib (execlib) {
  'use strict';
  return execlib.loadDependencies('client', ['allex:sinkholdermixin:lib'], creator.bind(null, execlib));
}

function creator (execlib, SinkHolderMixin) {
  var ret = {
  };
  require('./upload')(execlib, SinkHolderMixin, ret);
  require('./download')(execlib, SinkHolderMixin, ret);
  return ret;
}

module.exports = createLib;
