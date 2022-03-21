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
            const apiUrl = process.env.API_URL;
            const oAuthUrl = process.env.AUTH_URL;
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
        const logLevel = core.getInput('log_level');
        const context = github.context;
        const repo = context.payload.repository
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
        const eventDetails = {
            'workflow' : context.workflow,
            'action' : context.action,
            'externalId' : context.runId,
            'trigger_type' : context.eventName
        }
        var scanCommand = process.cwd() + util.format(constants.COMMANDS.SCAN, outputFormat, context.actor, context.runNumber, context.payload.repository.html_url, "BUILD", process.env.GITHUB_REF_NAME, context.sha);
        if (iacdir) {
            scanCommand = scanCommand + " -d " + process.cwd() + '/' + iacdir;
        } else if (iacfile) {
            scanCommand = scanCommand + " -f " + process.cwd() + '/' + iacfile;
        } else {
            scanCommand = scanCommand + " -d " + process.cwd();
        }
        scanCommand = scanCommand + " --repo-details " + "'" + JSON.stringify(repoDetails) + "'"
                                  + " --event-details " + "'" + JSON.stringify(eventDetails) + "'";
        if(logLevel){
            scanCommand = scanCommand + " -l " + logLevel;
        }
        exec(scanCommand, (error, stdout, stderr) => {
            try {
                const fail_build = core.getInput('fail_build') == 'true';
                if (stderr) {
                    console.log(stderr);
                    core.setFailed("Issue in running IaC scan");
                }
                if(error && error.code === 0){
                    core.setFailed("Errors Observed within IaC files from repository");
                } else if(error && error.code === 2 && fail_build){
                    core.setFailed("Violations Observed within IaC files from repository");
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