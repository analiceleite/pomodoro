const { spawn } = require('child_process');
const path = require('path');
const { logInfo, logError } = require('./logger');

let backendProcess;

function startBackend() {
    const backendPath = path.join(__dirname, '../../backend');

    logInfo('Iniciando backend...');

    // Para desenvolvimento, usar tsx
    // Para produção (build), usar node com o arquivo compilado
    const isProduction = process.env.NODE_ENV === 'production';

    if (isProduction && require('fs').existsSync(path.join(backendPath, 'dist/server.js'))) {
        // Modo produção - usar arquivo compilado
        backendProcess = spawn('node', ['dist/server.js'], {
            cwd: backendPath,
            stdio: 'inherit',
            shell: true,
            env: {
                ...process.env,
                NODE_ENV: 'production'
            }
        });
    } else {
        // Modo desenvolvimento - usar tsx
        backendProcess = spawn('npx', ['tsx', 'src/server.ts'], {
            cwd: backendPath,
            stdio: 'inherit',
            shell: true,
            env: {
                ...process.env,
                NODE_ENV: 'development'
            }
        });
    }

    backendProcess.on('error', (error) => {
        logError(`Erro ao iniciar backend: ${error.message}`);
    });

    backendProcess.on('exit', (code) => {
        logInfo(`Backend encerrado com código: ${code}`);
    });

    return backendProcess;
}

function stopBackend() {
    logInfo('Forçando encerramento do backend...');
    backendProcess.kill('SIGKILL');
    backendProcess = null;
}

module.exports = { startBackend, stopBackend };