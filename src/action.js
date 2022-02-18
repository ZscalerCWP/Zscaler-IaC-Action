const core = require('@actions/core');
const auth = require('./zscanner/auth.js');
const downloader = require('./zscanner/downloader.js');
const installer = require('./zscanner/installer.js');
const scanner = require('./zscanner/scanner.js');

const clientId = core.getInput('client_id');
const clientSecret = core.getInput('client_secret');
const soft_build = core.getInput('fail_build') == 'false';
auth.getAccessToken(clientId, clientSecret).then((response) => {
    const accessToken = response.access_token;
    if (accessToken) {
        orchestrateScan(accessToken);
    } else {
        failBuild('Access not granted to proceed IAC scan');
    }
})

function orchestrateScan(accessToken) {
    core.info('Scan process Started at ::' + new Date());
    downloader.downloadZscannerBinary(accessToken).then((response) => {
        installer.extractAndInstallBinary().then((response) => {
            console.log(response);
            scanner.configCheck(clientId).then((response) => {
                scanner.login(clientId, clientSecret).then((response) => {
                    scanner.executeScan().then((response) => {
                        console.log(response);

                        scanner.logout().then((response) => {
                            console.log('Logged out of zscanner');
                        }).catch((err) => {
                            console.log('Issue in logout', err.message);
                        })
                    }).catch(err => {
                        console.log('Issue in scan exec', err.message);
                    })
                }).catch((err) => {
                    console.log('Issue in login command', err.message);
                });
            }).catch(err => {
                console.log('Issue in checking for custom configs', err.message);
            })
        }).catch((err) => {
            failBuild('Error during validation of install' + err);
        })
    }).catch((err) => {
        failBuild('Error in downloading Binary' + err)
    })
}

function failBuild(message) {
    if (soft_build) {
        core.setFailed(message);
    } else {
        core.info(message);
    }
}