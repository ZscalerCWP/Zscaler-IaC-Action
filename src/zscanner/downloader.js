const fs = require('fs');
const request = require('../utils/await_request.js');
const stream = require('stream');
const os = require('os');
const constants = require('./constants');
const core = require("@actions/core");

function downloadZscannerBinary(accessToken){
    return new Promise((resolve,reject) => {
    fs.mkdirSync(constants.DOWNLOAD_CONSTANTS.DOWNLOAD_DIR, { recursive: true });
    fs.mkdirSync(constants.DOWNLOAD_CONSTANTS.DOWNLOAD_DIR + constants.DOWNLOAD_CONSTANTS.DOWNLOAD_SUBDIR, { recursive: true });
    const fileName = constants.DOWNLOAD_CONSTANTS.DOWNLOAD_FILE;
    const filePath = constants.DOWNLOAD_CONSTANTS.DOWNLOAD_DIR + constants.DOWNLOAD_CONSTANTS.DOWNLOAD_SUBDIR + fileName;
    
    if(!fs.existsSync(filePath)){
        const inputApiUrl = process.env.API_URL;
        const apiUrl = (inputApiUrl && inputApiUrl !== "") ? inputApiUrl : 'https://api.zscwp.io';
        const binaryUrl = apiUrl + '/iac/onboarding/v1/cli/download';
        downloadFile(accessToken, binaryUrl, filePath).then((result) => {
            resolve(result);
        }).catch(err => {
            reject(err);
        });
    } else {
        reject('Binary downloaded');
    } 
    })
      
}

const downloadFile = function(accessToken, binaryUrl, downloadPath){
    return new Promise((resolve,reject) => {
        const inputVersion = process.env.CLI_VERSION;
        const downloadVersion = (inputVersion && inputVersion !== "") ? inputVersion : "v0.0.1";
    const options = {
        url: binaryUrl,
        method : constants.HTTP_METHODS.POST,
        data: {
            version: downloadVersion,
            platform: getPlatform(),
            arch: getArch(),
            get_redirect_link : false
        },
        headers: {
            'Authorization': 'Bearer ' + accessToken
        },
        responseType: constants.SCANNER_RESP_TYPE,
    };

    request(options).then((response) => {
        console.log('Responding to download');
        if(response.data instanceof stream.Stream) {
            writeResponseToFile(response.data, downloadPath).then((writeStatus) => {
                console.log('Download Successful');
                resolve(writeStatus);
            })
        } else {
            resolve('failure');
        }
    }).catch((err) => {
        reject(err);
    });    
})
}

const writeResponseToFile = function(binaryData, filePath){
    return new Promise((resolve, reject) => {
        const writer = fs.createWriteStream(filePath);
        binaryData.pipe(writer);
        var err = null;
        writer.on('error', error => {
            err = error;
            writer.close();
            reject(err);
        });
        writer.on('close', () => {
            if (!err) {
                resolve(true);
            }
        });
    })
}

function getPlatform() {
    switch (os.platform()) {
        case 'win32':
            return 'Windows';
        case 'darwin':
            return 'Darwin';
        case 'linux':
            return 'Linux';
    }
    return '';
}

function getArch() {
    switch (os.arch()) {
        case 'x64':
            return 'x86_64';
        case 'arm64':
            return 'arm64';
        case 'x32':
            return 'i386';

    }
    return '';
}
module.exports = {
    downloadZscannerBinary
}