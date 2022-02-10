const cmd = require('../utils/commandExecutor.js');
const constants = require('./constants');
const core= require('@actions/core');
const util = require("util");
const exec = require('child_process').exec;

const login = function(clientId, clientSecretKey){
    return new Promise((resolve,reject) => {
        console.log('Running zscaler scan');
        const rootDirPath = process.cwd();
        const initCommand = rootDirPath + util.format(constants.COMMANDS.LOGIN,clientId,clientSecretKey,'US');
        cmd.asyncExec(initCommand,null).then((response) => {
            resolve(response);
        }).catch((error) => {
            console.log('Error in storing access_token in context', error);
            reject(error);
        })

    })
}

const logout = function(){
    return new Promise((resolve,reject) => {
        const logoutCommand = process.cwd() + constants.COMMANDS.LOGOUT;
        cmd.asyncExec(logoutCommand,null).then((response) => {
            resolve(response);
        }).catch((error) => {
            reject(error);
        })
    })
}
const executeScan = function(){
    return new Promise((resolve,reject) => {
        const iacdir = core.getInput('iac_dir');
        const iacfile = core.getInput('iac_file');
        const outputFormat = core.getInput('output_format');
        var scanCommand = process.cwd() + "/zscanner scan -o " + outputFormat + " -d " + process.cwd();
        if(iacdir){
            scanCommand = scanCommand + '/' + iacdir;
        } else if (iacfile){
            scanCommand = scanCommand + '/' + iacfile;
        }

        exec(scanCommand, (error, stdout, stderr) => {
            try{
                if(outputFormat.startsWith('sarif') || outputFormat.endsWith('sarif')){
                    core.setOutput('sarif_file_path',process.cwd() + '/result.sarif')
                }
                if(outputFormat.startsWith('json')){
                    const output = JSON.parse(stdout);
                    resolve(output);
                }
                resolve(stdout);
            } catch(error){
                console.log('Scan command execution failed');
                reject(error);
            }
        })
    })
}
module.exports = {
    executeScan, login, logout
}