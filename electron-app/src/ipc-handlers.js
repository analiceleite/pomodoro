const { ipcMain, BrowserWindow } = require('electron');
const path = require('path');
const { logInfo } = require('./logger');

let pipWindow;

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
                preload: path.join(__dirname, '../pip-window/pip-preload.js')
            },
            show: false
        });

        const pipHtmlPath = path.join(__dirname, '../pip-window/pip-window.html');
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
}

module.exports = { setupIPCHandlers };