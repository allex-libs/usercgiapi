function createUploadHandlers (execlib, SinkHolderMixin, mylib) {
  'use strict';

  require('./basecreator')(execlib, SinkHolderMixin, mylib);
  require('./uploadhandlercreator')(execlib, mylib);
  require('./uploaduniquehandlercreator')(execlib, mylib);
  require('./uploadcontentshandlercreator')(execlib, mylib);
  require('./uploadimagehandlercreator')(execlib, mylib);
  require('./uploadimagearrayelementhandlercreator')(execlib, mylib);
}

module.exports = createUploadHandlers;
