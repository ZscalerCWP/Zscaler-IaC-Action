var region = {
    'US' : {
        'auth_url' : 'https://auth.us.zcpcloud.net',
        'api_url' : 'https://api.zcpcloud.net'
    },
    'CUSTOM' : {
        'auth_url' : process.env.AUTH_URL,
        'api_url' : process.env.API_URL
    }
}

module.exports = region