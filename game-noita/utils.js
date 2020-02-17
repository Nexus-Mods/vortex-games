const path = require("path");

function hasBasename(file, basename) {
  path.basename(file).toLowerCase() == basename;
}

function isModXML(file) {
  hasBasename(file, "mod.xml");
}

function isModInstaller(files) {
  files.find(
    file =>
      hasBasename(file, "moduleconfig.xml") &&
      hasBasename(path.dirname(file), "fomod")
  );
}

module.exports = {
  isModXML,
  isModInstaller
};
