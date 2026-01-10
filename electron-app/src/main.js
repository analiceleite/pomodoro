const { app, BrowserWindow } = require('electron');
const path = require('path');
const { startBackend, stopBackend } = require('./backend');
const { setupIPCHandlers } = require('./ipc-handlers');
const { logInfo } = require('./logger');
require('./pip-window');

let mainWindow;

app.on('ready', () => {
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
    
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    const isDev = process.env.NODE_ENV !== 'production';
    let indexPath;
    
    if (isDev) {
        // Development path
        indexPath = path.join(__dirname, '../../frontend', 'dist', 'frontend', 'browser', 'index.html');
    } else {
        // Production path - files are in resources/app.asar
        indexPath = path.join(process.resourcesPath, 'frontend', 'dist', 'frontend', 'browser', 'index.html');
    }
    
    console.log('Loading index from:', indexPath);
    console.log('File exists:', require('fs').existsSync(indexPath));
    
    if (require('fs').existsSync(indexPath)) {
        mainWindow.loadFile(indexPath);
    } else {
        console.error('❌ index.html not found at:', indexPath);
        // Fallback to a simple HTML page
        mainWindow.loadURL('data:text/html,<h1>Loading...</h1><p>Frontend files not found</p>');
    }

    startBackend();
    setupIPCHandlers(mainWindow, null);
});

app.on('window-all-closed', () => {
    stopBackend();
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('will-quit', () => {
    stopBackend();
});

app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        app.emit('ready');
    }
});