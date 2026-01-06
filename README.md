# pomodoro
Personal productivity app built with Angular, Node.js and Electron.

## About

This project was developed for personal use and learning purposes.
It is a desktop Pomodoro application built with Angular, Node.js, Electron and SQLite,
focused on productivity and offline usage.

## General vision

```yml
Pomodoro App (Windows)
│
├── Frontend: Angular
│   └── UI, timer, history, statistics
│
├── Backend: Node.js (Express or Fastify)
│   └── Business logic
│   └── Pomodoro control
│   └── Persistence
│
├── Database: SQLite
│   └── Local file (pomodoro.db)
│
└── Desktop container: Electron
    └── Generates the executable (.exe)
```

* No external server
* Do not rely on internet
* Only one executable

## Stack

* Frontend: 
    - Standalone Components
    - RxJS 
    - Material UI 

* Backend 
    - Node.js
    - Express
    - SQLite

* Desktop 
    - Electron 
    - Electron Builder

## How to Build and Run

### Build the Application
To generate the executable for the Pomodoro app, follow these steps:

1. **Install Dependencies**:
   Make sure all dependencies are installed by running:
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

### Run the Application
- To test the app in development mode, use:
  ```bash
  npm start
  ```

- To run the generated executable, navigate to `dist-electron/` and double-click the `.exe` file.

### Notes
- The app includes an embedded SQLite database (`pomodoro.db`) for local data storage.
- Ensure the `backend` folder and database file are included during the build process.
- Update the app version in `package.json` before generating a new build.
