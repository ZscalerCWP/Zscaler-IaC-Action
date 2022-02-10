let constants = {
    HTTP_METHODS : {
        POST : "POST",
        GET  : "GET"
    },
    AUTH_CONSTANTS : {
       TYPE : "client_credentials",
       AUDIENCE : "https://api.zscwp.io",
        CONTENT_TYPE : "application/x-www-form-urlencoded"
    },
    DOWNLOAD_CONSTANTS : {
        DOWNLOAD_DIR : "zscanner_installed",
        DOWNLOAD_SUBDIR : "/download",
        DOWNLOAD_FILE : "/iac-scanner.tar.gz",
        EXTRACTION_SUBDIR : "/extract"
    },
    COMMANDS : {
        LOGIN : "/zscanner login -t client-credentials --client-id %s --client-secret %s -r %s --disable-prompts",
        SCAN : "/zscanner scan --scan-id %s --show-passed -o json -d ",
        SCANI : "/zscanner scan -o json",
        LOGOUT : "/zscanner logout"
    },
    SCANNER_RESP_TYPE : "stream"
}

module.exports = Object.freeze(constants);