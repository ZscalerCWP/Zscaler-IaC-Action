const axios = require('../utils/await_request.js')
const qse = require('query-string');
const constants = require('./constants');
const core = require("@actions/core");

function getAccessToken(clientId,clientSecretKey){
    return new Promise((resolve,reject) => {
        try {
            const inputUrl = process.env.AUTH_URL;
            const oAuthUrl = (inputUrl && inputUrl !== "") ? inputUrl : 'https://z-cwp-prod-us.us.auth0.com';
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
                  console.log('Error in authentication' , error.message);
                  // reject(error);
              })
          } catch(err){
              reject(err);
          }
    })
}

module.exports = {
    getAccessToken
}