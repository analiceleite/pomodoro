// Dados do timer
let timerData = {
    phase: 'work',
    timeRemaining: 25 * 60,
    isRunning: false,
    progress: 0,
    formattedTime: '25:00',
    cycleCount: 1,
    timerVisible: true
};

// Elementos DOM
const timerContainer = document.getElementById('timerContainer');
const phaseIndicator = document.getElementById('phaseIndicator');
const timerDisplay = document.getElementById('timerDisplay');
const progressFill = document.getElementById('progressFill');
const cyclesInfo = document.getElementById('cyclesInfo');
const toggleBtn = document.getElementById('toggleBtn');
const skipBreakBtn = document.getElementById('skipBreakBtn');

// Atualizar display
function updateDisplay() {
    // Fase
    const phaseNames = {
        work: 'TRABALHO',
        shortBreak: 'PAUSA CURTA',
        longBreak: 'PAUSA LONGA'
    };
    phaseIndicator.textContent = phaseNames[timerData.phase] || 'TRABALHO';

    // Timer
    timerDisplay.textContent = timerData.timerVisible ? timerData.formattedTime : '-- : --';

    // Progress
    progressFill.style.width = timerData.progress + '%';

    // Cycles
    cyclesInfo.textContent = `Ciclo ${timerData.cycleCount}`;

    // Botão toggle
    toggleBtn.innerHTML = timerData.isRunning ? '<i class="material-icons">pause</i>' : '<i class="material-icons">play_arrow</i>';
    toggleBtn.title = timerData.isRunning ? 'Pausar' : 'Iniciar';

    // Botão de visibilidade
    const visibilityBtn = document.getElementById('visibilityBtn');
    visibilityBtn.innerHTML = timerData.timerVisible ? '<i class="material-icons">visibility</i>' : '<i class="material-icons">visibility_off</i>';
    visibilityBtn.title = timerData.timerVisible ? 'Ocultar timer' : 'Mostrar timer';

    // Botão pular pausa - mostrar apenas durante pausas
    if (timerData.phase === 'shortBreak' || timerData.phase === 'longBreak') {
        skipBreakBtn.style.display = 'inline-block';
    } else {
        skipBreakBtn.style.display = 'none';
    }

    // Classes CSS baseadas na fase
    timerContainer.className = `timer-container phase-${timerData.phase}`;
    if (timerData.isRunning) {
        timerContainer.classList.add('running');
        timerDisplay.classList.add('pulse');
    } else {
        timerDisplay.classList.remove('pulse');
    }
}

// Ações
function toggleTimer() {
    if (window.electron && window.electron.pipActions) {
        window.electron.pipActions.sendAction('toggle');
    }
}

function resetTimer() {
    if (window.electron && window.electron.pipActions) {
        window.electron.pipActions.sendAction('reset');
    }
}

function skipBreak() {
    if (window.electron && window.electron.pipActions) {
        window.electron.pipActions.sendAction('skipBreak');
    }
}

function toggleTimerVisibility() {
    timerData.timerVisible = !timerData.timerVisible;
    updateDisplay();
}

function closePiP() {
    if (window.electron && window.electron.pip) {
        window.electron.pip.close();
    }
}

// Escutar updates do timer
if (window.electron && window.electron.ipcRenderer) {
    window.electron.ipcRenderer.on('timer-data-update', (event, data) => {
        console.log('📥 Dados recebidos do timer:', data);
        timerData = { ...timerData, ...data };
        updateDisplay();
    });
} else {
    console.warn('⚠️ window.electron.ipcRenderer não disponível');
}

// Inicializar
updateDisplay();
console.log('✅ pip-window.js inicializado');