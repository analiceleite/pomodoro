const chalk = require('chalk');

// Função genérica de log
function log(message, color = chalk.white) {
    const timestamp = new Date().toISOString();
    const formattedMessage = `${chalk.gray(`[${timestamp}]`)} ${color(message)}`;
    console.log(formattedMessage);
}

// Logs específicos
function logError(message) {
    log(`ERROR: ${message}`, chalk.red);
}

function logInfo(message) {
    log(`INFO: ${message}`, chalk.blue);
}

function logWarning(message) {
    log(`WARNING: ${message}`, chalk.yellow);
}

function logSuccess(message) {
    log(`SUCCESS: ${message}`, chalk.green);
}

module.exports = { log, logError, logSuccess, logInfo, logWarning };