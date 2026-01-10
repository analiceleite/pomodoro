const { spawn } = require('child_process');
const path = require('path');
const { logInfo, logError } = require('./logger');

let backendProcess;

function startBackend() {
    logInfo('Iniciando backend...');

    const isPackaged = require('electron').app.isPackaged;
    
    let command, args, nodeEnv, backendPath;
    
    if (isPackaged) {
        // Em produção, usar o código compilado na pasta resources
        backendPath = path.join(process.resourcesPath, 'backend');
        command = 'node';
        args = ['dist/server.js'];
        nodeEnv = 'production';
        logInfo('Modo: Produção - usando código compilado');
    } else {
        // Em desenvolvimento, usar tsx watch
        backendPath = path.join(__dirname, '../../backend');
        command = 'npm';
        args = ['run', 'dev'];
        nodeEnv = 'development';
        logInfo('Modo: Desenvolvimento - usando tsx watch');
    }
    
    logInfo(`Backend path: ${backendPath}`);
    logInfo(`Executando: ${command} ${args.join(' ')}`);
    
    backendProcess = spawn(command, args, {
        cwd: backendPath,
        stdio: ['ignore', 'pipe', 'pipe'],
        shell: true,
        env: {
            ...process.env,
            NODE_ENV: nodeEnv,
            PORT: '3000',
            POMODORO_DATA_PATH: process.env.POMODORO_DATA_PATH
        },
        detached: false
    });

    // Capturar output do backend
    if (backendProcess.stdout) {
        backendProcess.stdout.on('data', (data) => {
            logInfo(`Backend: ${data.toString().trim()}`);
        });
    }

    if (backendProcess.stderr) {
        backendProcess.stderr.on('data', (data) => {
            logError(`Backend Error: ${data.toString().trim()}`);
        });
    }

    backendProcess.on('error', (error) => {
        logError(`Erro ao iniciar backend: ${error.message}`);
    });

    backendProcess.on('exit', (code, signal) => {
        if (code !== 0 && code !== null) {
            logError(`Backend encerrado com código: ${code}, signal: ${signal}`);
        } else {
            logInfo(`Backend encerrado normalmente (código: ${code}, signal: ${signal})`);
        }
    });

    backendProcess.on('close', (code, signal) => {
        logInfo(`Backend processo fechado (código: ${code}, signal: ${signal})`);
    });

    // Verificar se o processo ainda está rodando após alguns segundos
    setTimeout(() => {
        if (backendProcess && backendProcess.killed) {
            logError('Backend foi morto prematuramente');
        } else if (backendProcess && backendProcess.exitCode !== null) {
            logError(`Backend terminou prematuramente com código: ${backendProcess.exitCode}`);
        } else if (backendProcess) {
            logInfo('Backend ainda está rodando...');
            // Tentar fazer uma requisição para verificar se o servidor está funcionando
            testBackendConnection();
        }
    }, 3000);

    return backendProcess;
}

function testBackendConnection() {
    const http = require('http');
    
    const options = {
        hostname: 'localhost',
        port: 3000,
        path: '/pomodoro',
        method: 'GET',
        timeout: 5000
    };

    const req = http.request(options, (res) => {
        if (res.statusCode === 200) {
            logInfo('✅ Backend está respondendo corretamente');
        } else {
            logError(`❌ Backend respondeu com status: ${res.statusCode}`);
        }
    });

    req.on('error', (error) => {
        logError(`❌ Erro ao testar conexão com backend: ${error.message}`);
    });

    req.on('timeout', () => {
        logError('❌ Timeout ao testar conexão com backend');
        req.destroy();
    });

    req.end();
}

function stopBackend() {
    if (backendProcess) {
        logInfo('Encerrando backend...');
        
        try {
            // Em Windows, usar taskkill é mais eficaz
            if (process.platform === 'win32') {
                // Primeiro tentar encerramento gracioso
                backendProcess.kill();
                
                // Se não funcionar após 3 segundos, forçar encerramento
                setTimeout(() => {
                    if (backendProcess && !backendProcess.killed) {
                        logInfo('Forçando encerramento do backend...');
                        
                        // Usar taskkill para garantir que o processo seja morto
                        const { spawn } = require('child_process');
                        const killProcess = spawn('taskkill', ['/F', '/T', '/PID', backendProcess.pid], {
                            stdio: 'ignore'
                        });
                        
                        killProcess.on('close', () => {
                            logInfo('Backend forçadamente encerrado');
                        });
                    }
                }, 3000);
            } else {
                // Para outros sistemas (Linux/macOS)
                backendProcess.kill('SIGTERM');
                
                setTimeout(() => {
                    if (backendProcess && !backendProcess.killed) {
                        logInfo('Forçando encerramento do backend...');
                        backendProcess.kill('SIGKILL');
                    }
                }, 3000);
            }
        } catch (error) {
            logError(`Erro ao encerrar backend: ${error.message}`);
        }
        
        backendProcess = null;
    }
}

module.exports = { startBackend, stopBackend };