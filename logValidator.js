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

var _hasJson = false;
let resultValidate = {
  common: {
    hasNotJson: [],
    parsingSequence: []
  }
};
let validator = {
  //#region require common first
  hasJson: (file, key) => {
    console.log(`start::${key}::${file.file}`);
    if (file && file.json) {
      _hasJson = true;
    } else {
      if (file && file.file) {
        let debugInfo = {
          fineName: file.file
        };

        resultValidate.common.hasNotJson.push(debugInfo);
        console.log(`done::${key}::ob:${JSON.stringify(debugInfo)}`);
      }
    }
    console.log(`done::${key}::_hasJson:${_hasJson}`);
  },
  setParsingSequence: (file, key) => {
    if (!hasJson()) {
      return;
    }
    console.log(`start::${key}`);

    let ob = {
      num: resultValidate.common.parsingSequence.length + 1,
      fileName: file.file
    };
    resultValidate.common.parsingSequence.push(ob);
    console.log(`done::${key}::ob:${JSON.stringify(ob)}`);
  },
  //#endregion

  //#region require Ace Log first
  isFirstLog: (file, key) => {
    if (!hasJson()) {
      return;
    }
    console.log(`start::${key}`);

    let startts = getStartTS(key, file.file, file.json.st);
    let getts = getGetTS(key, file.file, file.json.st);
    //#region 이전에 저장되어 있는 startts 유무 확인
    let isFirstLog = startts in resultValidate;
    //#endregion
    if (!isFirstLog) {
      resultValidate[startts] = {
        //#region 최초 로그 관련 저장
        firstLogInfo: {
          hasFirstLog: !isFirstLog,
          //#region 최초 로그는 startts, getts 가 같아야 함
          isSameStartTsGetTs: startts.localeCompare(getts) == 0,
          //#endregion
          vk: isFirstVk(key, file.file, file.json.vk),
          fileNmae: file.file
        },
        //#endregion
        needCheckFiles: [],
        //#region validator 진행과정에 발생 정보 저장
        processingInfo: {
          needCheck: false,
          fileNmae: file.file,
          debugMessages: []
        }
        //#endregion
      };
    } else {
      let starttsObject = resultValidate[startts];
      let processingInfo = starttsObject.processingInfo;

      let resultIsSameStartTsGetTs = startts.localeCompare(getts) == 0;
      if (resultIsSameStartTsGetTs) {
        processingInfo.needCheck = true;
        processingInfo.debugMessages.push(
          `startts, getts가 같습니다. >>startts: ${startts}, getts: ${getts}, resultIsSameStartTsGetTs: ${resultIsSameStartTsGetTs}<<`
        );

        if (!starttsObject.needCheck.includes(file.file)) {
          starttsObject.needCheck.push(file.file);
        }
      }

      let resultVK = isFirstVk(key, file.file, file.json.vk);
      if (resultVK) {
        processingInfo.needCheck = true;
        processingInfo.debugMessages.push(
          `vk가 1입니다. >>vk: ${file.json.vk}<<`
        );

        if (!starttsObject.needCheck.includes(file.file)) {
          starttsObject.needCheck.push(file.file);
        }
      }
    }

    console.log(`done::${key}::${JSON.stringify(resultValidate[startts])}`);
    console.log(`done::${key}`);
  },
  //#endregion

  hasLogSource: (file, key) => {
    if (!hasJson()) {
      return;
    }
    console.log(`start::${key}`);

    console.log(`done::${key}::file.json.logsource :: ${file.json.logsource}`);
  }
};

function validate(file, cb) {
  console.log(file);
  initJSONObject(file);

  Object.entries(validator).forEach(([key, value]) => value(file, key));

  cb("우하하");
}

function initJSONObject(file) {}

//#region Validator Helper
function getGetTS(key, fileName, st) {
  let stSplit = st.split("|");
  if (stSplit.length > 1) {
    return stSplit[1];
  } else {
    console.log(`${key}::${fileName}::ST GetTS분할에 실패했습니다.::${st}`);
    return "";
  }
}

function getStartTS(key, fileName, st) {
  let stSplit = st.split("|");
  if (stSplit.length > 0) {
    return stSplit[0];
  } else {
    console.log(
      `${key}::${fileName}::ST getStartTS분할에 실패했습니다.::${st}`
    );
    return "";
  }
}

function hasJson() {
  return _hasJson;
}

function isFirstVk(key, fileName, vk) {
  if (vk) {
    return vk.localeCompare("1") == 0;
  } else {
    console.log(`${key}::${fileName}::vk 문제가 있습니다.::${vk}`);
    return false;
  }
}
//#endregion

module.exports = {
  start,
  validate
};
