"use strict";

const electron = require("electron");
const app = electron.app;
const Menu = electron.Menu;
const Tray = electron.Tray;
const BrowserWindow = electron.BrowserWindow;

let appIcon = null;
let mainWindow = null;

const notes = [
  {
    title: "todo list",
    contents: "grocery shopping\npick up kids\nsend birthday party invites"
  },
  {
    title: "grocery list",
    contents: "Milk\nEggs\nDouble Cream"
  },
  {
    title: "birthday invites",
    contents: "Dave\nSue\nSally\nJohn and Joanna\nChris and Georgina\nElliot"
  }
];

function displayNote(note) {
  mainWindow.webContents.send("displayNote", note);
}

function addNoteToMenu(note) {
  return {
    label: note.title,
    type: "normal",
    click: () => {
      displayNote(note);
    }
  };
}

app.on("window-all-closed", () => {
  // if (process.platform !== "darwin") {
  app.quit();
  // }
});

function createWindow() {
  appIcon = new Tray("./images/icon@2x.png");
  let contextMenu = Menu.buildFromTemplate(notes.map(addNoteToMenu));
  appIcon.setToolTip("Notes app");
  appIcon.setContextMenu(contextMenu);
  // 브라우저 창을 생성합니다.
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 600,
    minWidth: 1100,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: true
    }
  });

  // and load the index.html of the app.
  mainWindow.loadFile("index.html");
  mainWindow.on("closed", () => {
    mainWindow = null;
  });
  mainWindow.webContents.on("dom-ready", () => {
    displayNote(notes[0]);
  });
}

app.on("ready", createWindow);
