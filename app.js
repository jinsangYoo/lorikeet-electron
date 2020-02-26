"use strict";

const fileSystem = require("./fileSystem");
const userInterface = require("./userInterface");
const search = require("./search");

function main() {
  userInterface.bindDocument(window);
  let folderPath = fileSystem.getUserHomeFolder();
  userInterface.loadDirectory(folderPath)(window);
  userInterface.bindSearchField(event => {
    // console.log("============S");
    // console.log(event);
    // console.log(event.target);
    // console.log(event.currentTarget);
    // console.log("============E");
    const query = event.target.value;
    if (query === "") {
      userInterface.resetFilter();
    } else {
      search.find(query, userInterface.filterResults);
    }
  });
}

window.onload = main;
