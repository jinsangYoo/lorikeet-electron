"use strict";

const fileSystem = require("./fileSystem");
const userInterface = require("./userInterface");

function start(folderPath, cb) {
  console.log(`folderPath: ${folderPath}`);

  fileSystem.getFilesInFolder(folderPath, (err, files) => {
    // UI 업데이트 위치
    if (err) {
      return alert("Sorry, you could not load your folder.");
    }
    console.log(`files.length: ${files.length}`);
    fileSystem.inspectAndAceLogFiles(folderPath, files, cb);
  });
}

let validatorInfo = {};
let validator = {
  isFirstLog: (object, key) => {
    console.log(`${key}::object.file :: ${object.file}`);
    console.log(`${key}::object.json.vk :: ${object.json.vk}`);
  },
  hasLogSource: (object, key) => {
    console.log(`${key}::object.file :: ${object.file}`);
    console.log(`${key}::object.json.logsource :: ${object.json.logsource}`);
  }
};

function validate(file, cb) {
  console.log(file);
  initJSONObject(file);

  Object.entries(validator).forEach(([key, value]) => value(file, key));

  cb("우하하");
}

function initJSONObject(file) {}

module.exports = {
  start,
  validate
};
