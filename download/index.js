function createDownloads (execlib, SinkHolderMixin, mylib) {
  require('./downloadhandlercreator')(execlib, SinkHolderMixin, mylib);
}

module.exports = createDownloads;
