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

module.exports = {
  start
};
