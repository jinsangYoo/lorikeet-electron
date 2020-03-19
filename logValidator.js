"use strict";

const fileSystem = require("./fileSystem");
const userInterface = require("./userInterface");

var _hasJson;
var resultValidate;
function start(folderPath, cb) {
  console.log(`folderPath: ${folderPath}`);
  _hasJson = false;
  resultValidate = {
    common: {
      hasNotJson: [],
      parsingSequence: [],
      needCheckFiles: []
    }
  };

  fileSystem.getFilesInFolder(folderPath, (err, files) => {
    // UI 업데이트 위치
    if (err) {
      return alert("Sorry, you could not load your folder.");
    }
    console.log(`files.length: ${files.length}`);
    fileSystem.inspectAndAceLogFiles(folderPath, files, cb);
  });
}

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
          fileName: file.file
        },
        //#endregion

        prev: file.json,

        //#region validator 진행과정에 발생 정보 저장
        processingInfo: {
          needCheck: false,
          fileName: file.file,
          debugMessages: []
        }
        //#endregion
      };
    } else {
      let starttsObject = resultValidate[startts];
      let processingInfo = starttsObject.processingInfo;
      processingInfo.fileName = file.file;

      let resultIsSameStartTsGetTs = startts.localeCompare(getts) == 0;
      if (resultIsSameStartTsGetTs) {
        processingInfo.needCheck = true;
        processingInfo.debugMessages.push(
          `startts, getts가 같습니다. >>startts: ${startts}, getts: ${getts}, resultIsSameStartTsGetTs: ${resultIsSameStartTsGetTs}<<`
        );
      }

      let resultVK = isFirstVk(key, file.file, file.json.vk);
      if (resultVK) {
        processingInfo.needCheck = true;
        processingInfo.debugMessages.push(
          `vk가 1입니다. >>vk: ${file.json.vk}<<`
        );
      }
    }

    // console.log(`done::${key}::${JSON.stringify(resultValidate[startts])}`);
    console.log(`done::${key}`);
  },
  //#endregion

  hasLogSource: (file, key) => {
    if (!hasJson()) {
      return;
    }
    console.log(`start::${key}`);

    console.log(`done::${key}::file.json.logsource :: ${file.json.logsource}`);
  },

  isValidRef: (file, key) => {
    if (!hasJson()) {
      return;
    }
    console.log(`start::${key}`);

    let startts = getStartTS(key, file.file, file.json.st);
    let starttsObject = resultValidate[startts];
    let processingInfo = starttsObject.processingInfo;

    if (!file.json.ref) {
      processingInfo.needCheck = true;
      processingInfo.debugMessages.push(
        `ref 값 확인이 필요합니다. >>ref: ${file.json.ref}<<`
      );
    } else {
      if (isFirstLog(key, file.file, file.json.st, file.json.vk)) {
        console.log(`>>ref: ${file.json.ref}<<`);
        if (file.json.ref.toLowerCase().localeCompare("bookmark") != 0) {
          // console.log(`1.오류 확인 >>ref: ${file.json.ref}<<`);
          processingInfo.needCheck = true;
          processingInfo.debugMessages.push(
            `로그가 최초 로그인데 ref가 bookmark가 아닙니다. >>ref: ${file.json.ref}<<`
          );
        }
      } else {
        if (
          resultValidate[startts].prev.url.localeCompare(file.json.ref) != 0
        ) {
          // console.log(`2.오류 확인 >>ref: ${file.json.ref}<<`);
          processingInfo.needCheck = true;
          processingInfo.debugMessages.push(
            `이전 로그의 url 이 이번 로그의 ref 값이 아닙니다. >>prev.url: ${resultValidate[startts].prev.url}, ref: ${file.json.ref}<<`
          );
        }
      }
    }

    console.log(`done::${key}`);
  },

  //#region require common last
  finish: (file, key) => {
    console.log(`start::${key}`);

    let startts = getStartTS(key, file.file, file.json.st);
    let starttsObject = resultValidate[startts];
    if (starttsObject.processingInfo.needCheck) {
      resultValidate.common.needCheckFiles.push(starttsObject.processingInfo);
    }

    delete starttsObject.processingInfo;
    starttsObject.processingInfo = {
      needCheck: false,
      fileName: null,
      debugMessages: []
    };

    delete resultValidate[startts].prev;
    resultValidate[startts].prev = file.json;

    console.log(`done::${key}::${JSON.stringify(resultValidate[startts])}`);
    console.log(`done::${key}`);
  }
  //#endregion
};

//#region public method
function validate(file, cb) {
  console.log(file);

  Object.entries(validator).forEach(([key, value]) => value(file, key));

  cb(resultValidate);
}
//#endregion

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

function isFirstLog(key, fileName, st, vk) {
  return isSameStartTsGetTs(key, fileName, st) && isFirstVk(key, fileName, vk);
}

function isFirstVk(key, fileName, vk) {
  if (vk) {
    return vk.localeCompare("1") == 0;
  } else {
    console.log(`${key}::${fileName}::vk 문제가 있습니다.::${vk}`);
    return false;
  }
}

function isSameStartTsGetTs(key, fileName, st) {
  let startts = getStartTS(key, fileName, st);
  let getts = getGetTS(key, fileName, st);
  return startts.localeCompare(getts) == 0;
}
//#endregion

module.exports = {
  start,
  validate
};
