const fs = require('fs');
const cmd = require('../utils/commandExecutor.js');
const targz = require('targz');
const constants = require('./constants');

async function extractAndInstallBinary(){
    return new Promise((resolve,reject) => {
        const extractionPath = constants.DOWNLOAD_CONSTANTS.DOWNLOAD_DIR + constants.DOWNLOAD_CONSTANTS.EXTRACTION_SUBDIR;
        fs.mkdirSync(extractionPath, { recursive: true });
        const downloadedPath = process.cwd() + '/' + constants.DOWNLOAD_CONSTANTS.DOWNLOAD_DIR + constants.DOWNLOAD_CONSTANTS.DOWNLOAD_SUBDIR + constants.DOWNLOAD_CONSTANTS.DOWNLOAD_FILE;
        console.log(fs.existsSync(downloadedPath));
        extractFile(downloadedPath,extractionPath).then((status) => {
            if(status){
                console.log('Came into installation part',status);
                installBinary(extractionPath).then((status) => {
                     resolve(status);
                });
            } else{
                reject('failure');
            }
        }).catch((err) => {
            console.log(err);
        });
    });
}


async function extractFile(sourceFilePath, destinationDirPath){
    return new Promise((resolve,reject) => {
        targz.decompress({
            src: sourceFilePath,
            dest: destinationDirPath
        }, function (err) {
            if (err) {
                reject(err);
            } else {
                resolve(true);
            }
        });
    })
}

async function installBinary(extractedFileDir){
    return await new Promise((resolve,reject) => {
        let binaryInstallPath = extractedFileDir + '/zscanner';
        const installationDir = extractedFileDir.replace(/(\s+)/g, '\\$1');
        binaryInstallPath = binaryInstallPath.replace(/(\s+)/g, '\\$1');
        const binaryName = '/zscanner-iii';
        const finalPath = installationDir + binaryName;
        console.log('install ' + binaryInstallPath + ' ' + installationDir);
        cmd.asyncExec('install ' + binaryInstallPath + ' ' + process.cwd()).then((response) => {
            console.log('Installation done', response);
            resolve(finalPath);
        }).catch((error) => {
            console.log(error);
            reject(error);
        });
        
    })
}
module.exports = {
    extractAndInstallBinary
}