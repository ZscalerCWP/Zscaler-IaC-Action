/******/ (() => { // webpackBootstrap
/******/ 	var __webpack_modules__ = ({

/***/ 675:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const axios = __nccwpck_require__(952)

module.exports = async (value) => {
        return await new Promise((resolve,reject) => {
            axios(value).then(function(response){
                //console.log(response.data);
                resolve(response);
            }).catch((error) => {
                reject(error);
            })
        })
}

/***/ }),

/***/ 932:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const exec = (__nccwpck_require__(81).exec);

async function asyncExec (commandToExecute, options){
    
    const defaultOptions =  { maxBuffer: 1024 * 1000 };
    return await new Promise((resolve, reject) => {
        exec(commandToExecute, { ...defaultOptions, ...options }, (err, stdout, stderr) => {
            if (err) { return reject(err); }
            resolve(stdout);
        });
    });
}

module.exports = {
    asyncExec
}


/***/ }),

/***/ 781:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const axios = __nccwpck_require__(675)
const qse = __nccwpck_require__(356);
const constants = __nccwpck_require__(986);
const region = __nccwpck_require__(966)
const core = __nccwpck_require__(838);

function getAccessToken(clientId,clientSecretKey){
    return new Promise((resolve,reject) => {
        try {
            const inputRegion = core.getInput('region');
            const oAuthUrl = region[inputRegion].auth_url
            const options = {
                url: oAuthUrl + '/oauth/token',
                data: qse.stringify({
                    'grant_type': constants.AUTH_CONSTANTS.TYPE,
                    'audience' : constants.AUTH_CONSTANTS.AUDIENCE,
                    'client_id' : clientId,
                    'client_secret' : clientSecretKey
                }),
                method : constants.HTTP_METHODS.POST,
                headers : {
                    'Content-Type': constants.AUTH_CONSTANTS.CONTENT_TYPE
                }
              };
              axios(options).then((response) => {
                  resolve(response.data);
              }).catch((error) => {
                  if(error.response && error.response.status){
                    if(error.response.status === 401) {
                        console.log('Your tenant no longer has an entitlement to Infrastructure as Code Scanning, please contact your account team to acquire a license');
                    } else if(error.response.status === 403){
                        console.log('Your tenant entitlement to Infrastructure as Code Scanning has expired, please contact your account team to renew your license');
                    } else {
                        console.log('Error in authentication');
                    }
                  } else {
                      console.log('Error in authentication' , error.message);
                      reject(error);
                  }
                  reject(error);
              })
          } catch(err){
              reject(err);
          }
    })
}

module.exports = {
    getAccessToken
}


/***/ }),

/***/ 986:
/***/ ((module) => {

let constants = {
    HTTP_METHODS : {
        POST : "POST",
        GET  : "GET"
    },
    AUTH_CONSTANTS : {
       TYPE : "client_credentials",
       AUDIENCE : "https://api.zscwp.io/iac",
        CONTENT_TYPE : "application/x-www-form-urlencoded"
    },
    DOWNLOAD_CONSTANTS : {
        DOWNLOAD_DIR : "zscanner_installed",
        DOWNLOAD_SUBDIR : "/download",
        DOWNLOAD_FILE : "/iac-scanner.tar.gz",
        EXTRACTION_SUBDIR : "/extract"
    },
    COMMANDS : {
        LOGIN : "login cc -m cicd --client-id %s --client-secret %s -r %s",
        SCAN : "scan -m cicd --sub-type GITHUB_ACTION --repo-type GITHUB -o %s --triggered-by %s --event-id %s --repo %s --event-type %s --branch %s --ref %s",
        LOGOUT : "logout -m cicd",
        CONFIG_ADD : "config add -m cicd -k %s -v %s",
    },
    SCANNER_RESP_TYPE : "stream"
}

module.exports = Object.freeze(constants);


/***/ }),

/***/ 756:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const fs = __nccwpck_require__(147);
const request = __nccwpck_require__(675);
const stream = __nccwpck_require__(955);
const os = __nccwpck_require__(37);
const constants = __nccwpck_require__(986);
const core = __nccwpck_require__(838);
const region = __nccwpck_require__(966)

function downloadZscannerBinary(accessToken){
    return new Promise((resolve,reject) => {
    fs.mkdirSync(constants.DOWNLOAD_CONSTANTS.DOWNLOAD_DIR, { recursive: true });
    fs.mkdirSync(constants.DOWNLOAD_CONSTANTS.DOWNLOAD_DIR + constants.DOWNLOAD_CONSTANTS.DOWNLOAD_SUBDIR, { recursive: true });
    const fileName = constants.DOWNLOAD_CONSTANTS.DOWNLOAD_FILE;
    const filePath = constants.DOWNLOAD_CONSTANTS.DOWNLOAD_DIR + constants.DOWNLOAD_CONSTANTS.DOWNLOAD_SUBDIR + fileName;
    
    if(!fs.existsSync(filePath)){
        const inputRegion = core.getInput('region');
        const apiUrl = region[inputRegion].api_url;
        const binaryUrl = apiUrl + '/iac/onboarding/v1/cli/download';
        downloadFile(accessToken, binaryUrl, filePath).then((result) => {
            resolve(result);
        }).catch(err => {
            reject(err);
        });
    } else {
        reject('Zscanner CLI already downloaded');
    } 
    })
      
}

const downloadFile = function(accessToken, binaryUrl, downloadPath){
    return new Promise((resolve,reject) => {
    const options = {
        url: binaryUrl,
        method : constants.HTTP_METHODS.POST,
        data: {
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
        if(response.data instanceof stream.Stream) {
            writeResponseToFile(response.data, downloadPath).then((writeStatus) => {
                console.log('Zscaler IaC Scanner Download Successful');
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


/***/ }),

/***/ 346:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const fs = __nccwpck_require__(147);
const cmd = __nccwpck_require__(932);
const targz = __nccwpck_require__(168);
const constants = __nccwpck_require__(986);

async function extractAndInstallBinary(){
    return new Promise((resolve,reject) => {
        const extractionPath = constants.DOWNLOAD_CONSTANTS.DOWNLOAD_DIR + constants.DOWNLOAD_CONSTANTS.EXTRACTION_SUBDIR;
        fs.mkdirSync(extractionPath, { recursive: true });
        const downloadedPath = process.cwd() + '/' + constants.DOWNLOAD_CONSTANTS.DOWNLOAD_DIR + constants.DOWNLOAD_CONSTANTS.DOWNLOAD_SUBDIR + constants.DOWNLOAD_CONSTANTS.DOWNLOAD_FILE;        
        extractFile(downloadedPath,extractionPath).then((status) => {
            if(status){                
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
        cmd.asyncExec('install ' + binaryInstallPath + ' ' + process.cwd()).then((response) => {
            console.log('Zscaler IaC Scanner Installation completed');
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

/***/ }),

/***/ 966:
/***/ ((module) => {

var region = {
    'US' : {
        'auth_url' : 'https://auth.us.zpccloud.net',
        'api_url' : 'https://api.zpccloud.net'
    },
    'CUSTOM' : {
        'auth_url' : process.env.AUTH_URL,
        'api_url' : process.env.API_URL
    }
}

module.exports = region

/***/ }),

/***/ 116:
/***/ ((module, __unused_webpack_exports, __nccwpck_require__) => {

const cmd = __nccwpck_require__(932);
const constants = __nccwpck_require__(986);
const core = __nccwpck_require__(838);
const github = __nccwpck_require__(766);
const util = __nccwpck_require__(837);
const exec = (__nccwpck_require__(81).exec);
const fs = __nccwpck_require__(147);

const login = function (clientId, clientSecretKey) {
    return new Promise((resolve, reject) => {
        console.log('Running zscaler scan');
        const region = core.getInput('region');
        const initCommand = getBinaryPath() + util.format(constants.COMMANDS.LOGIN, clientId, clientSecretKey, region);
        console.log("Zscanner Login command" + initCommand);
        cmd.asyncExec(initCommand, null).then((response) => {
            console.log("Zscanner login is successful");
            resolve(response);
        }).catch((error) => {
            console.log('Error in storing access_token in context', error);
            reject(error);
        })

    })
}

const logout = function () {
    return new Promise((resolve, reject) => {
        const logoutCommand = getBinaryPath() + constants.COMMANDS.LOGOUT;
        cmd.asyncExec(logoutCommand, null).then((response) => {
            resolve(response);
        }).catch((error) => {
            reject(error);
        })
    })
}

const configCheck = function (clientId) {
    return new Promise((resolve, reject) => {
        const region = core.getInput('region');
        if (region === 'CUSTOM') {
            const custom_config = {
                'host': process.env.API_URL,
                'auth': {
                    'host': process.env.AUTH_URL,
                    'clientId': clientId,
                    'scope': 'offline_access openid profile',
                    'audience': constants.AUTH_CONSTANTS.AUDIENCE
                }
            }
            const customRegionCmd = getBinaryPath() + util.format(constants.COMMANDS.CONFIG_ADD, 'custom_region', getJsonString(custom_config));
            console.log("Zscanner Custom Region Config Command ::" + customRegionCmd);
            cmd.asyncExec(customRegionCmd, null).then((response) => {
                console.log(response);
                resolve(response);
            }).catch(error => {
                console.log('Error in storing custom_region in context', error);
                reject(error);
            })
        } else{
            resolve('');
        }

    });
}

const executeScan = function () {
    return new Promise((resolve, reject) => {

        const iacdir = core.getInput('iac_dir');
        const iacfile = core.getInput('iac_file');
        const outputFormat = core.getInput('output_format');
        const logLevel = core.getInput('log_level');
        const context = github.context;
        const repo = context.payload.repository
        var branchName = process.env.GITHUB_REF_NAME;
        const repoDetails = {
            'default_branch' : repo.default_branch,
            'full_name' : repo.full_name,
            'id' : repo.id,
            'name' : repo.name,
            'owner' : repo.owner.name,
            'updated_time' : repo.updated_at,
            'url' : repo.html_url,
            'visibility' : repo.visibility
        }
        var eventDetails = {
            'workflow' : context.workflow,
            'action' : context.action,
            'externalId' : context.runId,
            'trigger_type' : context.eventName,
            'user_url' : context.payload.sender.html_url,
            'user_avatar' : context.payload.sender.avatar_url,
        }

        if (context.eventName === "push") {
            eventDetails.compare_url = context.payload.compare;
            eventDetails.commit_url = context.payload.head_commit.url;
        } else if (context.eventName === "pull_request"){
            eventDetails.pr_url = context.payload.pull_request.html_url;
            eventDetails.diff_url = context.payload.pull_request.diff_url;
            eventDetails.head_url = context.payload.pull_request.head.repo.html_url;
            eventDetails.base_url = context.payload.pull_request.base.repo.html_url;
            eventDetails.created_at = context.payload.pull_request.created_at;
            eventDetails.updated_at = context.payload.pull_request.updated_at;
            branchName = context.payload.pull_request.head.ref;
        }

        var scanCommand = getBinaryPath() + util.format(constants.COMMANDS.SCAN, outputFormat, context.actor, context.runNumber, context.payload.repository.html_url, "BUILD", branchName, context.sha);
        if (iacdir) {
            scanCommand = scanCommand + " -d " + process.cwd() + '/' + iacdir;
        } else if (iacfile) {
            scanCommand = scanCommand + " -f " + process.cwd() + '/' + iacfile;
        } else {
            scanCommand = scanCommand + " -d " + process.cwd();
        }
        scanCommand = scanCommand + " --repo-details " + getJsonString(repoDetails)
                                  + " --event-details " + getJsonString(eventDetails);
        if(logLevel){
            scanCommand = scanCommand + " -l " + logLevel;
        }
        console.log(scanCommand);
        exec(scanCommand, (error, stdout, stderr) => {
            try {
                const fail_build = core.getInput('fail_build') == 'true';
                var scan_status = 'passed';
                if (stderr) {
                    console.log("stderr: " + stderr);
                }
                if(error && error.code === 0){
                    scan_status = 'failed';
                    core.setFailed("Errors Observed within IaC files from repository");
                } else if(error && error.code === 2 && fail_build){
                    scan_status = 'failed';
                    core.setFailed("Violations Observed within IaC files from repository");
                } else {
                    scan_status = 'passed';
                }
                sarifPath = process.cwd() + '/result.sarif';
                if(fs.existsSync(sarifPath)) {
                    core.setOutput('sarif_file_path', sarifPath)
                }
                core.setOutput('scan_status', scan_status);
                resolve(stdout);
            } catch (error) {
                console.log('Scan command execution failed');
                reject(error);
            }
        })
    })
}

const getBinaryPath = function(){
    if (process.platform === "win32"){
        return "zscanner ";
    }
    return "./zscanner ";
}

const getJsonString = function(jsonObj){
    if (process.platform === "win32"){
        var myJSONString = JSON.stringify(jsonObj);
        var myEscapedJSONString = myJSONString.replace(/[\\]/g, '\\\\')
            .replace(/[\"]/g, '\\\"')
            .replace(/[\/]/g, '\\/')
            .replace(/[\b]/g, '\\b')
            .replace(/[\f]/g, '\\f')
            .replace(/[\n]/g, '\\n')
            .replace(/[\r]/g, '\\r')
            .replace(/[\t]/g, '\\t');;
        return "\"" + myEscapedJSONString + "\"";
    }
    return "'" + JSON.stringify(jsonObj) + "'";
}

module.exports = {
    executeScan, login, logout, configCheck
}


/***/ }),

/***/ 838:
/***/ ((module) => {

module.exports = eval("require")("@actions/core");


/***/ }),

/***/ 766:
/***/ ((module) => {

module.exports = eval("require")("@actions/github");


/***/ }),

/***/ 952:
/***/ ((module) => {

module.exports = eval("require")("axios");


/***/ }),

/***/ 356:
/***/ ((module) => {

module.exports = eval("require")("query-string");


/***/ }),

/***/ 168:
/***/ ((module) => {

module.exports = eval("require")("targz");


/***/ }),

/***/ 81:
/***/ ((module) => {

"use strict";
module.exports = require("child_process");

/***/ }),

/***/ 147:
/***/ ((module) => {

"use strict";
module.exports = require("fs");

/***/ }),

/***/ 37:
/***/ ((module) => {

"use strict";
module.exports = require("os");

/***/ }),

/***/ 955:
/***/ ((module) => {

"use strict";
module.exports = require("stream");

/***/ }),

/***/ 837:
/***/ ((module) => {

"use strict";
module.exports = require("util");

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __nccwpck_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		var threw = true;
/******/ 		try {
/******/ 			__webpack_modules__[moduleId](module, module.exports, __nccwpck_require__);
/******/ 			threw = false;
/******/ 		} finally {
/******/ 			if(threw) delete __webpack_module_cache__[moduleId];
/******/ 		}
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/compat */
/******/ 	
/******/ 	if (typeof __nccwpck_require__ !== 'undefined') __nccwpck_require__.ab = __dirname + "/";
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
// This entry need to be wrapped in an IIFE because it need to be isolated against other modules in the chunk.
(() => {
const core = __nccwpck_require__(838);
const auth = __nccwpck_require__(781);
const downloader = __nccwpck_require__(756);
const installer = __nccwpck_require__(346);
const scanner = __nccwpck_require__(116);

const clientId = core.getInput('client_id');
const clientSecret = core.getInput('client_secret');
const region = core.getInput('region');

if(typeof clientId === 'undefined' || clientId == null|| clientId.length<1 ){
    core.setFailed('client_id input is required and not supplied.');
}
if(typeof clientSecret === 'undefined' || clientSecret == null|| clientSecret.length<1 ){
    core.setFailed('client_secret input is required and not supplied.');
}
if(typeof region === 'undefined' || region == null|| region.length<1 ){
    core.setFailed('region input is required and not supplied.');
}
auth.getAccessToken(clientId, clientSecret).then((response) => {
    const accessToken = response.access_token;
    if (accessToken) {
        orchestrateScan(accessToken);
    } else {
        failBuild('Authorization failed');
    }
}).catch((err) => {
    failBuild('Error in generating token');
})

function orchestrateScan(accessToken) {
    core.info('IaC Scan Started at ::' + new Date());
    downloader.downloadZscannerBinary(accessToken).then((response) => {
        installer.extractAndInstallBinary().then((response) => {
            scanner.configCheck(clientId).then((response) => {
                scanner.login(clientId, clientSecret).then((response) => {
                    scanner.executeScan().then((response) => {
                        console.log(response);
                        scanner.logout().then((response) => {
                            console.log('Logged out of zscanner');
                        }).catch((err) => {
                            failBuild('Issue in zscanner logout' + err.message);
                        })
                    }).catch(err => {
                        failBuild('Issue in running scan' + err.message);
                    })
                }).catch((err) => {
                    failBuild('Issue in zscanner login' + err.message);
                });
            }).catch(err => {
                failBuild('Issue in checking for custom configs' + err.message);
            })
        }).catch((err) => {
            failBuild('Error during validation of install' + err);
        })
    }).catch((err) => {
        failBuild('Error in downloading Binary' + err)
    })
}

function failBuild(message) {
    core.setFailed(message);
}

})();

module.exports = __webpack_exports__;
/******/ })()
;