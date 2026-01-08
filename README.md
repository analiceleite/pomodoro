# Pomodoro App

Personal productivity app built with Angular, Node.js, Electron, and SQLite.

---

## Features

- **Timer with Picture-in-Picture Mode**: Stay focused with a timer that can pop out into a resizable, always-on-top window.
- **Multi-Monitor Support**: Move the main application window between monitors with keyboard shortcuts or UI controls.
- **Window Management**: Drag the application between monitors, maximize/restore, and position controls.
- **Dark Mode**: A sleek dark theme for better usability in low-light environments.
- **Statistics Dashboard**: Track your productivity with detailed session statistics.
- **Offline Support**: Fully functional without an internet connection.
- **Cross-Platform**: Runs on Windows, macOS, and Linux.
- **SQLite Integration**: Local database for storing session history.
- **Electron Executable**: A single `.exe` file for easy distribution.

---

## Window Controls & Keyboard Shortcuts

### Multi-Monitor Navigation
- **Ctrl+Shift+M**: Move to next monitor
- **Ctrl+Shift+1**: Move to monitor 1 (primary)
- **Ctrl+Shift+2**: Move to monitor 2
- **Ctrl+Shift+3**: Move to monitor 3
- **Ctrl+Shift+F**: Toggle maximize/restore window

### UI Controls
When running in Electron with multiple monitors detected:
- **Monitor buttons**: Click numbered monitor buttons to move window to specific display
- **Next Monitor button**: Cycle through available displays
- **Maximize button**: Toggle between maximized and windowed state
- **Picture-in-Picture controls**: Move PiP window between monitors (when PiP is active)

---

## Current Version

**1.0.0 Beta**

---

## How to Build and Run

### Build the Application

1. **Install Dependencies**:
   ```bash
   npm install
   ```

2. **Build the Frontend**:
   Navigate to the `frontend` folder and build the Angular app:
   ```bash
   cd frontend
   npm run build
   ```

3. **Generate the Executable**:
   Return to the root directory and run the Electron Builder:
   ```bash
   cd ..
   npm run build:electron
   ```

4. **Locate the Executable**:
   The generated `.exe` file will be located in the `dist-electron/` folder.

### Useful build commands

# Build completo
npm run build

# Apenas limpar artifacts
npm run build:clean

# Build individual
npm run build:frontend
npm run build:backend
npm run build:electron

# Instalar dependências em todos os módulos
npm run install-all

# Desenvolvimento
npm run dev

### Run the Application

- To test the app in development mode, use:
  ```bash
  npm start
  ```

- To run the generated executable, navigate to `dist-electron/` and double-click the `.exe` file.

---

## Multi-Monitor Setup

The application automatically detects available monitors and provides:

1. **Window dragging**: You can drag the window title bar to move between monitors
2. **Keyboard shortcuts**: Use the shortcuts listed above for quick navigation
3. **UI controls**: When multiple monitors are detected, control buttons appear in the timer interface
4. **Picture-in-Picture**: PiP windows can also be moved between monitors independently

### Troubleshooting Multi-Monitor

- If monitors are not detected correctly, try restarting the application
- Keyboard shortcuts work globally when the application has focus
- The application remembers window positions between sessions
- On Windows, ensure extended display mode is enabled (not duplicate)

---

## Technical Details

### Architecture
- **Frontend**: Angular 20+ with Material Design components
- **Backend**: Node.js with Express and TypeScript
- **Database**: SQLite for local storage
- **Desktop**: Electron with secure context isolation
- **Communication**: IPC (Inter-Process Communication) between Electron main and renderer

### Security Features
- Context isolation enabled
- Node integration disabled in renderer
- Secure preload script for API exposure
- No direct access to Node.js APIs from frontend

---

## Notes

- The app includes an embedded SQLite database (`pomodoro.db`) for local data storage.
- Ensure the `backend` folder, `preload.js`, and database file are included during the build process.
- Update the app version in `package.json` before generating a new build.
- Multi-monitor features are only available in the Electron version, not in browser mode.
