function run () {
  console.log(arguments);
  process.exit(0);
}

module.exports = {
  identity: {
    __remote__username: 'blah',
    __remote__password: '123456'
  },
  cb: run
};
