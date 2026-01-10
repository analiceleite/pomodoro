const { app, BrowserWindow } = require('electron');
const path = require('path');
const { startBackend, stopBackend } = require('./backend');
const { setupIPCHandlers } = require('./ipc-handlers');
const { closePiPWindow } = require('./pip-window');
const { logInfo } = require('./logger');
require('./pip-window');

let mainWindow;

app.on('ready', async () => {
    const userDataPath = app.getPath('userData');
    process.env.POMODORO_DATA_PATH = userDataPath;

    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        fullscreen: false,
        frame: true,
        webPreferences: {
            nodeIntegration: false,
            contextIsolation: true,
            preload: path.join(__dirname, '../preload.js'),
            webSecurity: false,
            backgroundThrottling: false
        },
        show: false
    });

    logInfo('🚀 Iniciando backend...');
    startBackend();
    
    logInfo('✅ Backend iniciado, carregando aplicação...');
    
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        logInfo('✅ Aplicação carregada');
    });

    // Handler para quando a janela principal for fechada
    mainWindow.on('closed', () => {
        logInfo('🛑 Janela principal fechada');
        mainWindow = null;
        stopBackend();
    });

    // Handler para antes da janela ser fechada
    mainWindow.on('close', (event) => {
        logInfo('🛑 Usuário está tentando fechar a janela...');
        // Permitir que a janela seja fechada normalmente
    });

    const isDev = process.env.NODE_ENV !== 'production';
    let indexPath;
    
    if (isDev) {
        indexPath = path.join(__dirname, '../../frontend', 'dist', 'frontend', 'browser', 'index.html');
    } else {
        indexPath = path.join(process.resourcesPath, 'frontend', 'dist', 'frontend', 'browser', 'index.html');
    }
    
    console.log('Loading index from:', indexPath);
    console.log('File exists:', require('fs').existsSync(indexPath));
    
    if (require('fs').existsSync(indexPath)) {
        mainWindow.loadFile(indexPath);
    } else {
        console.error('❌ index.html not found at:', indexPath);
        mainWindow.loadURL('data:text/html,<h1>Loading...</h1><p>Frontend files not found</p>');
    }

    setupIPCHandlers(mainWindow, null);
});

app.on('window-all-closed', () => {
    logInfo('🛑 Todas as janelas foram fechadas, encerrando aplicação...');
    
    // Fechar janela PIP se estiver aberta
    closePiPWindow();
    stopBackend();
    
    // Garantir que a aplicação seja fechada
    setTimeout(() => {
        app.quit();
    }, 1000);
    
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('will-quit', (event) => {
    logInfo('🛑 Aplicação está sendo encerrada...');
    
    // Prevenir o encerramento imediato para dar tempo de parar o backend
    event.preventDefault();
    
    closePiPWindow();
    stopBackend();
    
    // Após um breve delay, permitir o encerramento
    setTimeout(() => {
        app.exit(0);
    }, 1500);
});

app.on('before-quit', () => {
    logInfo('🛑 Preparando para encerrar aplicação...');
    closePiPWindow();
    stopBackend();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        app.emit('ready');
    }
});