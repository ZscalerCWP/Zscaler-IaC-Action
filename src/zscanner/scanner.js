const cmd = require('../utils/commandExecutor.js');
const constants = require('./constants');
const core = require('@actions/core');
const github = require('@actions/github');
const util = require("util");
const exec = require('child_process').exec;

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
                    'scope': 'offline_access_profile',
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
                    console.log(stderr);
                    scan_status = 'failed';
                    core.setFailed("Issue in running IaC scan");
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
                if (outputFormat.startsWith("sarif") || outputFormat.endsWith("sarif") ||
                    outputFormat.startsWith("github_sarif") || outputFormat.endsWith("github_sarif")) {
                    core.setOutput('sarif_file_path', process.cwd() + '/result.sarif')
                }
                core.setOutput('scan_status',scan_status);
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

const getBinaryPath = function(){
    if (process.platform === "win32"){
        return "zscanner ";
    }
    return "./zscanner ";
}

const getJsonString = function(jsonObj){
    if (process.platform === "win32"){
        return "\"" + JSON.stringify(JSON.stringify(jsonObj)) + "\"";
    }
    return "'" + JSON.stringify(jsonObj) + "'";
}

module.exports = {
    executeScan, login, logout, configCheck
}
