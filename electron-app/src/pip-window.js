const { BrowserWindow } = require('electron');
const { logSuccess } = require('./logger')
const path = require('path');

let pipWindow;

function createPiPWindow(mainWindow) {
    if (pipWindow) {
        pipWindow.focus();
        return true;
    }

    const windowOptions = {
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
            preload: path.join(__dirname, './preload.js')
        },
        show: false
    };

    pipWindow = new BrowserWindow(windowOptions);

    const pipHtmlPath = path.join(__dirname, '../pip-window/pip-window.html');
    pipWindow.loadFile(pipHtmlPath);

    pipWindow.once('ready-to-show', () => {
        pipWindow.show();
        logSuccess('Janela Picture-in-Picture criada com always-on-top');
    });

    pipWindow.on('closed', () => {
        pipWindow = null;
        if (mainWindow && !mainWindow.isDestroyed()) {
            mainWindow.webContents.send('pip-window-closed');
        }
    });

    return true;
}

function closePiPWindow() {
    if (pipWindow) {
        pipWindow.close();
        pipWindow = null;
        return true;
    }
    return false;
}

module.exports = { createPiPWindow, closePiPWindow };