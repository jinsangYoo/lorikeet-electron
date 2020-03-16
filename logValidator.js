"use strict";

const async = require("async");

const fileSystem = require("./fileSystem");
const userInterface = require("./userInterface");

function start(folderPath) {
  console.log(`folderPath: ${folderPath}`);

  fileSystem.getFilesInFolder(folderPath, (err, files) => {
    // UI 업데이트 위치
    if (err) {
      return alert("Sorry, you could not load your folder.");
    }
    console.log(`files.length: ${files.length}`);
    fileSystem.inspectAndAceLogFiles(folderPath, files, doneWhenDisplay);
  });
}

function doneWhenDisplay(err, resultParsingFiles) {
  if (err) {
    return alert("Sorry, we could not display your files.");
  }

  resultParsingFiles.forEach(displayFile);
}

function displayFile(file) {
  console.log(file);
}

module.exports = {
  start
};
