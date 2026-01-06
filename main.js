const { app, BrowserWindow } = require('electron');
const path = require('path');

let mainWindow;

app.on('ready', () => {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        fullscreen: true, 
        webPreferences: {
            nodeIntegration: true,
            contextIsolation: false
        }
    });

    // Remove this line in production
    // mainWindow.webContents.openDevTools();

    // Carrega o frontend Angular
    mainWindow.loadFile(path.join(__dirname, 'frontend/dist/frontend/browser/index.html'));
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});