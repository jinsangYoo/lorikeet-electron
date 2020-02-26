"use strict";

const lunr = require("lunr");
let index;

function resetIndex() {
  index = lunr(function() {
    this.field("file");
    this.field("type");
    this.ref("path");
  });
}

function addToIndex(file) {
  // console.log(`file.file: ${file.file}`);
  // console.log(`file.type: ${file.type}`);
  // console.log(`file.path: ${file.path}`);
  index.add(file);
}

function find(query, cb) {
  if (!index) {
    resetIndex();
  }
  const results = index.search(query);
  cb(results);
}

module.exports = {
  addToIndex,
  find,
  resetIndex
};
