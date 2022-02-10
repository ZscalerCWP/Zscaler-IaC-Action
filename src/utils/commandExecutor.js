const exec = require('child_process').exec;

async function asyncExec (commandToExecute, options){
    
    const defaultOptions =  { maxBuffer: 1024 * 1000 };
    return await new Promise((resolve, reject) => {
        exec(commandToExecute, { ...defaultOptions, ...options }, (err, stdout, stderr) => {
            if (err) { return reject(err); }
            resolve(stdout);
        });
    });
}

module.exports = {
    asyncExec
}
