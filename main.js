const { app, BrowserWindow, screen, globalShortcut, ipcMain } = require('electron');
const path = require('path');

let mainWindow;

// Função para obter informações dos monitores
function getDisplayInfo() {
    const displays = screen.getAllDisplays();
    return displays.map((display, index) => ({
        id: display.id,
        index: index,
        bounds: display.bounds,
        workArea: display.workArea,
        primary: display === screen.getPrimaryDisplay()
    }));
}

// Função para mover janela para monitor específico
function moveToDisplay(displayIndex = 0) {
    if (!mainWindow) return;
    
    const displays = screen.getAllDisplays();
    if (displayIndex >= displays.length) return;
    
    const targetDisplay = displays[displayIndex];
    const windowBounds = mainWindow.getBounds();
    
    // Calcular nova posição no centro do monitor alvo
    const newX = targetDisplay.workArea.x + Math.round((targetDisplay.workArea.width - windowBounds.width) / 2);
    const newY = targetDisplay.workArea.y + Math.round((targetDisplay.workArea.height - windowBounds.height) / 2);
    
    // Mover e focar a janela
    mainWindow.setPosition(newX, newY);
    mainWindow.focus();
    
    console.log(`Janela movida para monitor ${displayIndex + 1}:`, { x: newX, y: newY });
}

// Função para mover para o próximo monitor
function moveToNextDisplay() {
    if (!mainWindow) return;
    
    const displays = screen.getAllDisplays();
    if (displays.length <= 1) return;
    
    const currentDisplay = screen.getDisplayNearestPoint(mainWindow.getBounds());
    const currentIndex = displays.findIndex(display => display.id === currentDisplay.id);
    const nextIndex = (currentIndex + 1) % displays.length;
    
    moveToDisplay(nextIndex);
}

// Função para maximizar na tela atual
function toggleMaximize() {
    if (!mainWindow) return;
    
    if (mainWindow.isMaximized()) {
        mainWindow.unmaximize();
    } else {
        mainWindow.maximize();
    }
}

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

    // Configurar atalhos globais para movimentação entre monitores
    globalShortcut.register('Ctrl+Shift+M', () => {
        moveToNextDisplay();
    });
    
    globalShortcut.register('Ctrl+Shift+1', () => {
        moveToDisplay(0);
    });
    
    globalShortcut.register('Ctrl+Shift+2', () => {
        moveToDisplay(1);
    });
    
    globalShortcut.register('Ctrl+Shift+3', () => {
        moveToDisplay(2);
    });
    
    globalShortcut.register('Ctrl+Shift+F', () => {
        toggleMaximize();
    });

    // IPC handlers para comunicação com o frontend
    ipcMain.handle('get-displays', () => {
        return getDisplayInfo();
    });
    
    ipcMain.handle('move-to-display', (event, displayIndex) => {
        moveToDisplay(displayIndex);
        return true;
    });
    
    ipcMain.handle('move-to-next-display', () => {
        moveToNextDisplay();
        return true;
    });
    
    ipcMain.handle('toggle-maximize', () => {
        toggleMaximize();
        return mainWindow.isMaximized();
    });
    
    ipcMain.handle('get-window-position', () => {
        const bounds = mainWindow.getBounds();
        const currentDisplay = screen.getDisplayNearestPoint(bounds);
        return {
            bounds: bounds,
            display: currentDisplay,
            isMaximized: mainWindow.isMaximized()
        };
    });

    // Mostrar janela quando estiver pronta
    mainWindow.once('ready-to-show', () => {
        mainWindow.show();
        
        // Log informações dos monitores disponíveis
        const displays = getDisplayInfo();
        console.log('Monitores disponíveis:', displays.length);
        displays.forEach((display, index) => {
            console.log(`Monitor ${index + 1}:`, display.bounds, display.primary ? '(Principal)' : '');
        });
        
        console.log('Atalhos disponíveis:');
        console.log('  Ctrl+Shift+M - Mover para próximo monitor');
        console.log('  Ctrl+Shift+1 - Mover para monitor 1');
        console.log('  Ctrl+Shift+2 - Mover para monitor 2');
        console.log('  Ctrl+Shift+3 - Mover para monitor 3');
        console.log('  Ctrl+Shift+F - Alternar maximizar');
    });

    // Carrega o frontend Angular
    mainWindow.loadFile(path.join(__dirname, 'frontend/dist/frontend/browser/index.html'));
});

app.on('window-all-closed', () => {
    // Limpar atalhos globais antes de fechar
    globalShortcut.unregisterAll();
    
    if (process.platform !== 'darwin') {
        app.quit();
    }
});

app.on('will-quit', () => {
    // Limpar atalhos globais ao sair
    globalShortcut.unregisterAll();
});

// Handler para quando a aplicação fica ativa novamente (macOS)
app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
        createWindow();
    }
});