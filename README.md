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
│   └── UI, timer, histórico, estatísticas
│
├── Backend: Node.js (Express ou Fastify)
│   └── Regras de negócio
│   └── Controle do Pomodoro
│   └── Persistência
│
├── Banco de dados: SQLite
│   └── Arquivo local (pomodoro.db)
│
└── Container desktop: Electron
    └── Gera o executável (.exe)
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
