const { spawn } = require('child_process');
const { logInfo, logSuccess, logError, logWarning } = require('./electron-app/src/logger');
const fs = require('fs');

async function runCommand(command, args, cwd) {
    return new Promise((resolve, reject) => {
        logInfo(`Executando: ${command} ${args.join(' ')} em ${cwd}`);
        const process = spawn(command, args, {
            cwd: cwd,
            stdio: 'inherit',
            shell: true
        });

        process.on('close', (code) => {
            code === 0 ? resolve() : reject(new Error(`Falhou com código ${code}`));
        });
    });
}

async function checkPrerequisites() {
    logInfo('Verificando pré-requisitos...');
    
    // Verificar se as pastas existem
    const folders = ['./frontend', './backend', './electron-app'];
    for (const folder of folders) {
        if (!fs.existsSync(folder)) {
            throw new Error(`Pasta ${folder} não encontrada`);
        }
    }
    
    // Verificar se node_modules existem
    const nodeModulesFolders = ['./frontend/node_modules', './backend/node_modules', './electron-app/node_modules'];
    for (const folder of nodeModulesFolders) {
        if (!fs.existsSync(folder)) {
            logWarning(`${folder} não encontrado. Execute 'npm install' primeiro.`);
        }
    }
    
    logSuccess('Pré-requisitos verificados');
}

async function cleanBuildArtifacts() {
    logInfo('Limpando artifacts de build anteriores...');
    
    const foldersToClean = [
        './frontend/dist',
        './backend/dist',
        './releases'
    ];
    
    for (const folder of foldersToClean) {
        if (fs.existsSync(folder)) {
            fs.rmSync(folder, { recursive: true, force: true });
            logInfo(`Removido: ${folder}`);
        }
    }
}

async function buildFrontend() {
    logWarning('Building Angular frontend...');
    await runCommand('npm', ['run', 'build'], './frontend');
    
    // Verificar se o build foi bem-sucedido
    const distPath = './frontend/dist/frontend/browser';
    if (!fs.existsSync(distPath)) {
        throw new Error('Build do frontend falhou - pasta dist não encontrada');
    }
    logSuccess('Frontend buildado com sucesso');
}

async function buildBackend() {
    logWarning('Building Node.js backend...');
    await runCommand('npm', ['run', 'build'], './backend');
    
    // Verificar se o build foi bem-sucedido
    const distPath = './backend/dist';
    if (!fs.existsSync(distPath)) {
        throw new Error('Build do backend falhou - pasta dist não encontrada');
    }
    logSuccess('Backend buildado com sucesso');
}

async function buildElectron() {
    logWarning('Building Electron app...');
    await runCommand('npm', ['run', 'build'], './electron-app');
    
    logSuccess('Electron app buildado com sucesso');
}

async function buildAll() {
    const startTime = Date.now();
    logInfo('Build completo iniciado...\n');

    try {
        await checkPrerequisites();
        await cleanBuildArtifacts();
        await buildFrontend();
        await buildBackend();
        await buildElectron();

        const duration = ((Date.now() - startTime) / 1000).toFixed(2);
        logSuccess(`\nBuild concluído com sucesso em ${duration}s!`);
        logInfo('Executáveis disponíveis em: ./releases/');
        
        // Listar arquivos gerados
        if (fs.existsSync('./releases')) {
            const files = fs.readdirSync('./releases');
            logInfo('Arquivos gerados:');
            files.forEach(file => logInfo(`  - ${file}`));
        }

    } catch (error) {
        logError(`\nErro durante o build: ${error.message}`);
        process.exit(1);
    }
}

// Permitir argumentos da linha de comando
const args = process.argv.slice(2);
if (args.includes('--clean-only')) {
    cleanBuildArtifacts();
} else if (args.includes('--frontend-only')) {
    buildFrontend();
} else if (args.includes('--backend-only')) {
    buildBackend();
} else if (args.includes('--electron-only')) {
    buildElectron();
} else {
    buildAll();
}