"use strict";

const fileSystem = require("./fileSystem");
const userInterface = require("./userInterface");

function main() {
  userInterface.bindDocument(window);
  let folderPath = fileSystem.getUserHomeFolder();
  userInterface.loadDirectory(folderPath)(window);
}

window.onload = main;
