"use strict";

let $ = require("jquery");
const path = require("path");
const async = require("async");
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

//#region GUI
var highlightElements = [];
function addHighlightElements(fileName) {
  if (!fileName) {
    alert(`Sorry, we could not add highlight your ${fileName}.`);
    return;
  }

  if (!highlightElements.includes(fileName)) {
    highlightElements.push(fileName);

    let divTag = $('div[data-fileName="' + fileName + '"]');
    divTag.addClass("highlight");
  } else {
    removeAllHighlightElements();
  }
}

function removeAllHighlightElements() {
  highlightElements.forEach(fileName => {
    removeHighlightElements(fileName);
  });

  highlightElements = [];
}

function removeHighlightElements(fileName) {
  if (!fileName) {
    alert(`Sorry, we could not remove highlight your ${fileName}.`);
    return;
  }

  if (highlightElements.includes(fileName)) {
    let divTag = $('div[data-fileName="' + fileName + '"]');
    divTag.removeClass("highlight");
  }
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
      clearDebugMessagesChildView();
      clearNeedCheckFilesChildView();
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

  validate(resultParsingFiles, doneWhenValidate);
}

function doneWhenValidate(err, processingInfos) {
  updateValidateButtonText("Start");
  if (err) {
    alert("Sorry, we could not validate your files.");
    return;
  }

  console.log(`검증 완료::${JSON.stringify(processingInfos)}`);
  let needCheckFilesDiv = $("#needCheckFiles");
  processingInfos.forEach(processingInfo => {
    if (processingInfo.needCheck) {
      let inputTag = getNeedCheckFileInputTag(processingInfo.fileName);
      inputTag.click(function(event) {
        removeAllHighlightElements();
        addHighlightElements(processingInfo.fileName);

        clearDebugMessagesChildView();
        let jPreTag = getPreTag(
          processingInfo.debugMessages,
          "debugMessagesPre"
        );
        jPreTag.appendTo($("#debugMessages"));
      });
      inputTag.appendTo(needCheckFilesDiv);
    }
  });
}

function getPreTag(content, cssClassName) {
  let preTag = document.createElement("pre");
  let jPreTag = $(preTag);
  if (cssClassName) {
    jPreTag.addClass(cssClassName);
  }
  jPreTag.text(JSON.stringify(content, undefined, 2));
  return jPreTag;
}

function getNeedCheckFileInputTag(fileName) {
  let inputTag = $(document.createElement("input"));
  inputTag.attr("type", "button");
  inputTag.attr("value", fileName);
  inputTag.css("border", "1px solid red");
  return inputTag;
}

function validate(files, cb) {
  async.map(
    files,
    (file, asyncCb) => {
      //#region add json
      displayForAceLogFile(file);
      //#endregion
      logValidator.validate(file, asyncCb);
    },
    cb
  );
}

function displayForAceLogFile(file) {
  let divTag = $('div[data-fileName="' + file.file + '"]');
  divTag.children("details").remove();
  divTag.append(getDetailTag("json", file.json));
}

function getDetailTag(summary, content) {
  let detailsTag = $(document.createElement("details"));
  let summaryTag = document.createElement("summary");
  let jPreTag = getPreTag(content);

  detailsTag.css("border", "1px solid rgba(139, 233, 62, 0.466)");
  detailsTag.css("background", "rgb(245, 230, 111)");
  $(summaryTag)
    .text(summary)
    .appendTo(detailsTag);
  jPreTag.appendTo(detailsTag);

  return detailsTag;
}

function clearNeedCheckFilesChildView() {
  const needCheckFiles = document.getElementById("needCheckFiles");
  let firstChild = needCheckFiles.firstChild;
  while (firstChild) {
    needCheckFiles.removeChild(firstChild);
    firstChild = needCheckFiles.firstChild;
  }
}
function clearDebugMessagesChildView() {
  const debugMessages = document.getElementById("debugMessages");
  let firstChild = debugMessages.firstChild;
  while (firstChild) {
    debugMessages.removeChild(firstChild);
    firstChild = debugMessages.firstChild;
  }
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
