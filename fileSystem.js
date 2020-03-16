"use strict";

const async = require("async");
const fs = require("fs");
const osenv = require("osenv");
const path = require("path");

let shell;
if (process.versions.electron) {
  shell = require("electron").shell;
} else {
  shell = window.require("nw.gui").Shell;
}

function getUserHomeFolder() {
  return osenv.home();
}

function getCurrentFilePath() {
  return __dirname;
}

function getFilesInFolder(folderPath, cb) {
  fs.readdir(folderPath, cb);
}

function inspectAndDescribeFile(filePath, cb) {
  let result = {
    file: path.basename(filePath),
    path: filePath,
    type: ""
  };

  fs.stat(filePath, (err, stat) => {
    if (err) {
      cb(err);
    } else {
      if (stat.isFile()) {
        result.type = "file";
      }
      if (stat.isDirectory()) {
        result.type = "directory";
      }
      cb(err, result);
    }
  });
}

function inspectAndDescribeFiles(folderPath, files, cb) {
  async.map(
    files,
    (file, asyncCb) => {
      let resolvedFilePath = path.resolve(folderPath, file);
      inspectAndDescribeFile(resolvedFilePath, asyncCb);
    },
    cb
  );
}

function inspectAndAceLogFile(filePath, cb) {
  let result = {
    file: path.basename(filePath),
    path: filePath,
    json: null
  };

  const fileReader = fs.createReadStream(filePath, { encoding: "utf8" });
  var chunk = [];
  fileReader.on("data", data => {
    chunk.push(data);
  });
  fileReader.on("error", err => {
    cb(err);
  });
  fileReader.on("end", err => {
    if (err) {
      cb(err);
    } else {
      try {
        result.json = JSON.parse(chunk.join(""));
      } catch (e) {
        if (e instanceof SyntaxError) {
          printError(e, true);
        } else {
          printError(e, false);
        }

        cb(e);
        return;
      }

      cb(err, result);
    }
  });
}

function inspectAndAceLogFiles(folderPath, files, cb) {
  async.map(
    files,
    (file, asyncCb) => {
      let resolvedFilePath = path.resolve(folderPath, file);
      inspectAndAceLogFile(resolvedFilePath, asyncCb);
    },
    cb
  );
}

function openFile(filePath) {
  shell.openItem(filePath);
}

function printError(error, explicit) {
  console.log(
    `[${explicit ? "EXPLICIT" : "INEXPLICIT"}] ${error.name}: ${error.message}`
  );
}

module.exports = {
  getUserHomeFolder,
  getFilesInFolder,
  inspectAndDescribeFiles,
  inspectAndAceLogFiles,
  openFile,
  getCurrentFilePath
};
