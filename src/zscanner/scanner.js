const cmd = require('../utils/commandExecutor.js');
const constants = require('./constants');
const core = require('@actions/core');
const github = require('@actions/github');
const util = require("util");
const exec = require('child_process').exec;

const login = function (clientId, clientSecretKey) {
    return new Promise((resolve, reject) => {
        console.log('Running zscaler scan');
        const rootDirPath = process.cwd();
        const region = core.getInput('region');
        const initCommand = rootDirPath + util.format(constants.COMMANDS.LOGIN, clientId, clientSecretKey, region);
        cmd.asyncExec(initCommand, null).then((response) => {
            resolve(response);
        }).catch((error) => {
            console.log('Error in storing access_token in context', error);
            reject(error);
        })

    })
}

const logout = function () {
    return new Promise((resolve, reject) => {
        const logoutCommand = process.cwd() + constants.COMMANDS.LOGOUT;
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
            const inputApiUrl = process.env.API_URL;
            const apiUrl = (inputApiUrl && inputApiUrl !== "") ? inputApiUrl : 'https://main.dev.api.zscwp.io';
            const inputUrl = process.env.AUTH_URL;
            const oAuthUrl = (inputUrl && inputUrl !== "") ? inputUrl : 'https://zscaler-poc.us.auth0.com';
            const custom_config = {
                'host': apiUrl,
                'auth': {
                    'host': oAuthUrl,
                    'clientId': clientId,
                    'scope': 'offline_access_profile',
                    'audience': constants.AUTH_CONSTANTS.AUDIENCE
                }
            }
            const customRegionCmd = process.cwd() + util.format(constants.COMMANDS.CONFIG_ADD, 'custom_region', "'" + JSON.stringify(custom_config) + "'");
            cmd.asyncExec(customRegionCmd, null).then((response) => {
                console.log(response);
                resolve(response);
            }).catch(error => {
                console.log('Error in storing custom_region in context', error);
                reject(error);
            })

        }
        resolve('');
    });
}

const executeScan = function () {
    return new Promise((resolve, reject) => {
        const iacdir = core.getInput('iac_dir');
        const iacfile = core.getInput('iac_file');
        const outputFormat = core.getInput('output_format');
        const context = github.context;
        var scanCommand = process.cwd() + util.format(constants.COMMANDS.SCAN, outputFormat, context.actor, context.runNumber, context.payload.repository.html_url, context.eventName, process.env.GITHUB_REF_NAME, process.env.GITHUB_SHA);
        if (iacdir) {
            scanCommand = scanCommand + " -d " + process.cwd() + '/' + iacdir;
        } else if (iacfile) {
            scanCommand = scanCommand + " -f " + process.cwd() + '/' + iacfile;
        } else {
            scanCommand = scanCommand + " -d " + process.cwd();
        }

        exec(scanCommand, (error, stdout, stderr) => {
            try {
                if (stderr) {
                    console.log(stderr);
                }
                if (outputFormat.startsWith("sarif") || outputFormat.endsWith("sarif") ||
                    outputFormat.startsWith("github_sarif") || outputFormat.endsWith("github_sarif")) {
                    core.setOutput('sarif_file_path', process.cwd() + '/result.sarif')
                }
                if (outputFormat.startsWith("json")) {
                    const output = JSON.parse(stdout);
                    resolve(output);
                }
                resolve(stdout);
            } catch (error) {
                console.log('Scan command execution failed');
                reject(error);
            }
        })
    })
}
module.exports = {
    executeScan, login, logout, configCheck
}