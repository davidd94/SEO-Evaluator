const fs = require("fs-extra");

const settings = require("./settings");

function saveToJson(data, fileName, dir='') {
    const evalDir = dir || './evaluations';

    // create eval
    fs.access(evalDir, (err) => {
        if (err && err.code === 'ENOENT') {
            fs.mkdirSync(evalDir);
        };
    });

    fs.writeFileSync(`${evalDir}/${fileName}.json`, JSON.stringify(data));
};

function readJson(fileName, dir='') {
    const evalDir = dir || './evaluations';
    return fs.readJsonSync(`${evalDir}/${fileName}.json`);
};

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
};

// expose every methods of the moduleName to the Page, under window[moduleName] object.
async function exposeModuleMethods(page, moduleName) {
    const module = require(moduleName);
    const methodsNames = Object.getOwnPropertyNames(module);
    for (const methodName of methodsNames) {
      await page.exposeFunction('__' + moduleName + '_' + methodName, module[methodName]);
      await page.evaluate((moduleName, methodName) => {
        window[moduleName] = window[moduleName] || {};
        window[moduleName][methodName] = window['__' + moduleName + '_' + methodName]; // alias
      }, moduleName, methodName);
    }
};

async function getFileExtension(fileStr) {
    let file = fileStr.split('/').pop();
    const ext = file.substr(file.lastIndexOf('.') + 1, file.length);
    return ext || '';
};

exports.saveToJson = saveToJson;
exports.readJson = readJson;
exports.sleep = sleep;
exports.exposeModuleMethods = exposeModuleMethods;
exports.getFileExtension = getFileExtension;
