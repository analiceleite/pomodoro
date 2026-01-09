const { ipcMain, BrowserWindow, app } = require('electron');
const path = require('path');
const { logInfo } = require('./logger');

let pipWindow;

// Helper function to get the correct base path for pip-window files
function getPipWindowBasePath() {
    const isDev = !app.isPackaged;
    if (isDev) {
        return path.join(__dirname, '../pip-window');
    } else {
        // In production, files are in app.asar
        return path.join(__dirname, '../pip-window');
    }
}

function setupIPCHandlers(mainWindow) {
    let isAlwaysOnTop = false;

    // Always on top handlers
    ipcMain.handle('toggle-always-on-top', () => {
        if (mainWindow) {
            isAlwaysOnTop = !isAlwaysOnTop;
            mainWindow.setAlwaysOnTop(isAlwaysOnTop);
            logInfo(`Always on top: ${isAlwaysOnTop ? 'ATIVADO' : 'DESATIVADO'}`);
            return isAlwaysOnTop;
        }
        return false;
    });

    ipcMain.handle('get-always-on-top-status', () => isAlwaysOnTop);

    ipcMain.handle('set-always-on-top', (event, enable) => {
        if (mainWindow) {
            isAlwaysOnTop = enable;
            mainWindow.setAlwaysOnTop(isAlwaysOnTop);
            logInfo(`Always on top: ${isAlwaysOnTop ? 'ATIVADO' : 'DESATIVADO'}`);
            return isAlwaysOnTop;
        }
        return false;
    });

    // PiP handlers
    ipcMain.handle('open-pip', () => {
        if (pipWindow) {
            pipWindow.focus();
            return true;
        }

        const pipBasePath = getPipWindowBasePath();
        const preloadPath = path.join(pipBasePath, 'pip-preload.js');
        const pipHtmlPath = path.join(pipBasePath, 'pip-window.html');

        logInfo(`PiP base path: ${pipBasePath}`);
        logInfo(`PiP preload path: ${preloadPath}`);
        logInfo(`PiP HTML path: ${pipHtmlPath}`);

        // Check if files exist
        const fs = require('fs');
        const htmlExists = fs.existsSync(pipHtmlPath);
        const preloadExists = fs.existsSync(preloadPath);
        logInfo(`PiP HTML exists: ${htmlExists}`);
        logInfo(`PiP preload exists: ${preloadExists}`);

        if (!htmlExists) {
            console.error('❌ PiP HTML not found at:', pipHtmlPath);
            return false;
        }

        pipWindow = new BrowserWindow({
            width: 220,
            height: 220,
            resizable: true,
            frame: false,
            alwaysOnTop: true,
            skipTaskbar: true,
            minimizable: false,
            maximizable: false,
            webPreferences: {
                nodeIntegration: false,
                contextIsolation: true,
                preload: preloadPath
            },
            show: false
        });

        pipWindow.loadFile(pipHtmlPath);

        pipWindow.once('ready-to-show', () => {
            pipWindow.show();
            logInfo('Janela Picture-in-Picture criada');
        });

        pipWindow.on('closed', () => {
            pipWindow = null;
            if (mainWindow && !mainWindow.isDestroyed()) {
                mainWindow.webContents.send('pip-window-closed');
            }
        });

        return true;
    });

    ipcMain.handle('close-pip', () => {
        if (pipWindow) {
            pipWindow.close();
            pipWindow = null;
            return true;
        }
        return false;
    });

    ipcMain.handle('pip-action', (event, action) => {
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('pip-action-received', action);
            return true;
        }
        return false;
    });

    // Handler para enviar dados do timer para a janela PiP
    ipcMain.handle('send-data-to-pip', (event, data) => {
        if (pipWindow && !pipWindow.isDestroyed()) {
            pipWindow.webContents.send('timer-data-update', data);
            return true;
        }
        return false;
    });

    // Show a native notification from main process (used by renderer via preload)
    ipcMain.handle('show-notification', (event, payload) => {
        try {
            const { Notification } = require('electron');
            const notif = new Notification({
                title: payload.title || 'Pomodoro',
                body: payload.body || '',
                silent: payload.silent || false,
                icon: payload.icon ? path.join(__dirname, '..', payload.icon) : undefined
            });

            notif.show();
            logInfo('Native notification shown from main process', payload);
            return true;
        } catch (err) {
            console.error('❌ Failed to show native notification:', err);
            return false;
        }
    });
}

module.exports = { setupIPCHandlers };