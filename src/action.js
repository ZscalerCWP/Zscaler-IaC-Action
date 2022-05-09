const core = require('@actions/core');
const auth = require('./zscanner/auth.js');
const downloader = require('./zscanner/downloader.js');
const installer = require('./zscanner/installer.js');
const scanner = require('./zscanner/scanner.js');

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
