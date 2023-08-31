const axios = require('../utils/await_request.js')
const qse = require('query-string');
const constants = require('./constants');
const region = require('./region')
const core = require("@actions/core");

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
                        console.log('Your client credentials are invalid');
                    } else if(error.response.status === 403){
                        console.log('Your client credentials are invalid');                        
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
