var Promise = require("bluebird");
var fs = Promise.promisifyAll(require("fs"));
var mkdirp = require("mkdirp-then");

Promise.map([
  { fromPath: "../../es5/lib", toDir: "./es5/node_modules/", toName: "lib" },
  { fromPath: "../../src/lib", toDir: "./src/node_modules/", toName: "lib" }
], function (item) {
  var toPath = item.toDir + item.toName;

  return mkdirp(item.toDir)
  .then(function () { return fs.existsAsync(toPath); })
  .catch(function (err) {
    if (err.message === "true")
      return true;

    throw err;
  })
  .then(function (exists) {
    if (!exists) {
      return fs.symlinkAsync(item.fromPath, toPath, "dir");
    }
  })
  .catch(function (err) {
    if (err.cause.code === "EEXIST")
      return;

    throw err;
  });
});
