"use strict";

let $ = require("jquery");
const path = require("path");
const remote = require("electron").remote;

let document;
const fileSystem = require("./fileSystem");
const search = require("./search");
const logValidator = require("./logValidator");

//#region Common
//#region Util-Path
function convertFolderPathIntoLinks(folderPath) {
  const folders = folderPath.split(path.sep);
  const contents = [];
  let pathAtFolder = "";
  folders.forEach(folder => {
    pathAtFolder += folder + path.sep;
    contents.push(
      `<span class='path' data-path='${pathAtFolder.slice(
        0,
        -1
      )}'>${folder}</span>`
    );
  });

  return contents.join(path.sep).toString();
}

function convertFolderPathIntoLinkArrayForParentFolder(folderPath) {
  const currentFolderName = path.basename(folderPath);
  const folderNameArray = folderPath.match(new RegExp(currentFolderName, "g"));
  var currentFolderNameCount = folderNameArray.length;

  const folders = folderPath.split(path.sep);
  const contents = [];

  folders.forEach(folder => {
    if (
      folder.localeCompare(currentFolderName) == 0 &&
      currentFolderNameCount > 0
    ) {
      --currentFolderNameCount;
    }

    if (currentFolderNameCount > 0) {
      contents.push(folder);
    }
  });
  return contents;
}

function convertFolderPathIntoLinksForParentFolder(folderPath) {
  return convertFolderPathIntoLinkArrayForParentFolder(folderPath)
    .join(path.sep)
    .toString();
}

function getLogsFolderPath() {
  let contents = convertFolderPathIntoLinkArrayForParentFolder(__dirname);
  contents.push("getherServer");
  contents.push("logs");
  return contents.join(path.sep).toString();
}

function getSampleFolderPath() {
  let contents = convertFolderPathIntoLinkArrayForParentFolder(__dirname);
  contents.push("getherServer");
  contents.push("sample");
  return contents.join(path.sep).toString();
}
//#endregion
//#endregion

//#region GUI
//#region init/bind
function bindDocument(window) {
  if (!document) {
    document = window.document;
  }

  document.getElementById("file").addEventListener(
    "click",
    () => {
      let currentFolderInnerText = document.getElementById("current-folder")
        .innerText;
      // console.log(`file.path: ${currentFolderInnerText}`);
      fileSystem.openFile(currentFolderInnerText);
    },
    false
  );
  document.getElementById("current").addEventListener(
    "click",
    () => {
      loadDirectory(__dirname)();
    },
    false
  );
  document.getElementById("logs").addEventListener(
    "click",
    () => {
      let logsFolderPath = getLogsFolderPath();
      loadDirectory(logsFolderPath)();
    },
    false
  );
  document.getElementById("sample").addEventListener(
    "click",
    () => {
      let sampleFolderPath = getSampleFolderPath();
      loadDirectory(sampleFolderPath)();
    },
    false
  );

  const fullscreen = document.getElementById("fullscreen");
  fullscreen.addEventListener(
    "click",
    () => {
      const win = remote.getCurrentWindow();
      if (win.isFullScreen()) {
        win.setFullScreen(false);
        fullscreen.innerText = "Go full screen";
      } else {
        win.setFullScreen(true);
        fullscreen.innerText = "Exit full screen";
      }
    },
    false
  );

  document.getElementById("startBtn").addEventListener(
    "click",
    () => {
      let currentFolderInnerText = document.getElementById("current-folder")
        .innerText;
      logValidator.start(currentFolderInnerText, doneWhenInspectForAceLogFile);
      updateValidateButtonText("Prodcessing");
    },
    false
  );
}
//#endregion

//#region CurrentFolderPath
function bindCurrentFolderPath() {
  const load = event => {
    const folderPath = event.target.getAttribute("data-path");
    loadDirectory(folderPath)();
  };

  const paths = document.getElementsByClassName("path");
  for (let i = 0; i < paths.length; i++) {
    paths[i].addEventListener("click", load, false);
  }
}

function displayFolderPath(folderPath) {
  document.getElementById(
    "current-folder"
  ).innerHTML = convertFolderPathIntoLinks(folderPath);
  bindCurrentFolderPath();
}
//#endregion

//#region SearchField
function bindSearchField(cb) {
  document.getElementById("search").addEventListener("keyup", cb, false);
}

function filterResults(results) {
  const validFilePaths = results.map(result => {
    return result.ref;
  });
  const items = document.getElementsByClassName("item");
  for (let i = 0; i < items.length; i++) {
    const item = items[i];
    let filePath = item
      .getElementsByTagName("img")[0]
      .getAttribute("data-filepath");
    if (validFilePaths.indexOf(filePath) !== -1) {
      item.style = null;
    } else {
      item.style = "display:none;";
    }
  }
}

function resetFilter() {
  const items = document.getElementsByClassName("item");
  for (let i = 0; i < items.length; i++) {
    items[i].style = null;
  }
}
//#endregion

//#region file/directory
function clearView() {
  // console.log("clearView");
  const mainArea = document.getElementById("main-area");
  let firstChild = mainArea.firstChild;
  while (firstChild) {
    mainArea.removeChild(firstChild);
    firstChild = mainArea.firstChild;
  }
}

function loadDirectory(folderPath) {
  return function(window) {
    if (!document) {
      document = window.document;
    }
    search.resetIndex();
    displayFolderPath(folderPath);

    fileSystem.getFilesInFolder(folderPath, (err, files) => {
      clearView();
      if (err) {
        return alert("Sorry, you could not load your folder.");
      }
      // console.log(`files.length: ${files.length}`);
      fileSystem.inspectAndDescribeFiles(folderPath, files, displayFiles);
    });
  };
}

function displayFiles(err, files) {
  if (err) {
    return alert("Sorry, we could not display your files.");
  }

  files.forEach(displayFile);
}

function displayFile(file) {
  search.addToIndex(file);

  const mainArea = document.getElementById("main-area");
  const template = document.querySelector("#item-template");
  var clone = document.importNode(template.content, true);
  clone.querySelector("img").src = `images/${file.type}.svg`;
  clone.querySelector("img").setAttribute("data-filePath", file.path);
  clone.firstElementChild.setAttribute("data-fileName", file.file);

  if (file.type === "directory") {
    clone.querySelector("img").addEventListener(
      "dblclick",
      () => {
        loadDirectory(file.path)();
      },
      false
    );
    clone.querySelector(".filename").addEventListener(
      "dblclick",
      () => {
        loadDirectory(file.path)();
      },
      false
    );
  } else {
    clone.querySelector("img").addEventListener(
      "dblclick",
      () => {
        fileSystem.openFile(file.path);
      },
      false
    );
    clone.querySelector(".filename").addEventListener(
      "dblclick",
      () => {
        fileSystem.openFile(file.path);
      },
      false
    );
  }
  clone.querySelector(".filename").innerText = file.file;
  mainArea.appendChild(clone);
}
//#endregion

//#region validator
function updateValidateButtonText(text) {
  document.getElementById("startBtn").value = text;
}

function doneWhenInspectForAceLogFile(err, resultParsingFiles) {
  if (err) {
    alert("Sorry, we could not display your files.");
    updateValidateButtonText("Start");
    return;
  }

  resultParsingFiles.forEach(inspectAndAceLogFiles);
  updateValidateButtonText("Start");
}

function inspectAndAceLogFiles(file) {
  //#region normal css,GUI
  displayForAceLogFile(file);
  //#endregion

  logValidator.inspectAndAceLogFile(file, result => {
    console.log(`${file.file}::${result}::끝?`);
  });
}

function displayForAceLogFile(file) {
  let divTag = $('div[data-fileName="' + file.file + '"]');
  divTag.children("details").remove();
  divTag.append(getDetailTag("json", file.json));
}

function getDetailTag(summary, content) {
  let detailsTag = $(document.createElement("details"));
  let summaryTag = document.createElement("summary");
  let preTag = document.createElement("pre");

  detailsTag.css("border", "1px solid rgba(139, 233, 62, 0.466)");
  detailsTag.css("background", "rgba(216, 228, 53, 0.2)");
  $(summaryTag)
    .text(summary)
    .appendTo(detailsTag);
  $(preTag)
    .text(JSON.stringify(content, undefined, 2))
    .appendTo(detailsTag);

  return detailsTag;
}
//#endregion
//#endregion

module.exports = {
  bindDocument,
  displayFiles,
  loadDirectory,
  bindSearchField,
  filterResults,
  resetFilter
};
