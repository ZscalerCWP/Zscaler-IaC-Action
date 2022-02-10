const axios = require('axios')

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