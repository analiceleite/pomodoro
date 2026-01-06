const { app, BrowserWindow } = require('electron');
const path = require('path');

let mainWindow;

app.on('ready', () => {
    mainWindow = new BrowserWindow({
        width: 1200,
        height: 800,
        fullscreen: false, // Mudado para false para permitir movimentação
        frame: true, // Habilitar frame para facilitar arrastar
        webPreferences: {
            nodeIntegration: false, // Desabilitado para segurança
            contextIsolation: true, // Habilitado para segurança
            preload: path.join(__dirname, 'preload.js')
        },
        show: false // Não mostrar até estar pronta
    });

    // Remove this line in production
    // mainWindow.webContents.openDevTools();

    // Mostrar janela quando estiver pronta
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
    });

    // Carrega o frontend Angular
    mainWindow.loadFile(path.join(__dirname, 'frontend/dist/frontend/browser/index.html'));
});

app.on('window-all-closed', () => {
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

// Handler para quando a aplicação fica ativa novamente (macOS)
app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        // Recriar janela se necessário (macOS)
        app.emit('ready');
    }
});