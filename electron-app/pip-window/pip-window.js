// Dados do timer
let timerData = {
    componentType: 'timer', // 'timer' ou 'stopwatch'
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
const componentTypeEl = document.getElementById('componentType');
const phaseIndicator = document.getElementById('phaseIndicator');
const timerDisplay = document.getElementById('timerDisplay');
const progressFill = document.getElementById('progressFill');
const progressBar = document.querySelector('.progress-bar');
const cyclesInfo = document.getElementById('cyclesInfo');
const toggleBtn = document.getElementById('toggleBtn');
const skipBreakBtn = document.getElementById('skipBreakBtn');

// Atualizar display
function updateDisplay() {
    console.log('🔄 updateDisplay() chamado - componentType:', timerData.componentType);
    
    // Aplicar classes CSS corretas
    let classesToApply = `timer-container component-${timerData.componentType}`;
    
    // Adicionar classe de fase se for timer
    if (timerData.componentType === 'timer') {
        classesToApply += ` phase-${timerData.phase}`;
    } else if (timerData.componentType === 'stopwatch') {
        // Para stopwatch, usar uma classe específica
        classesToApply += ` phase-stopwatch`;
    }
    
    timerContainer.className = classesToApply;
    
    // Definir variável CSS de cor baseada no componente
    if (timerData.componentType === 'stopwatch') {
        timerContainer.style.setProperty('--phase-color', '#00D9FF');
        console.log('✅ Cor turquesa (#00D9FF) aplicada para STOPWATCH');
    } else if (timerData.componentType === 'timer') {
        const phaseColors = {
            work: '#6964ba',
            shortBreak: '#43a047',
            longBreak: '#1e88e5'
        };
        const color = phaseColors[timerData.phase] || '#6964ba';
        timerContainer.style.setProperty('--phase-color', color);
        console.log('✅ Cor de timer aplicada:', color, 'Fase:', timerData.phase);
    }
    
    console.log('🎨 Classes CSS aplicadas:', classesToApply);

    // Fase (para timer)
    let phaseText = '';
    if (timerData.componentType === 'timer') {
        const phaseNames = {
            work: 'TRABALHO',
            shortBreak: 'PAUSA CURTA',
            longBreak: 'PAUSA LONGA'
        };
        phaseText = phaseNames[timerData.phase] || 'TRABALHO';
    } else {
        phaseText = 'CRONÔMETRO';
    }
    phaseIndicator.textContent = phaseText;

    // Timer
    timerDisplay.textContent = timerData.timerVisible ? timerData.formattedTime : '-- : --';

    // Progress - esconder para cronômetro
    if (timerData.componentType === 'stopwatch') {
        progressBar.style.display = 'none';
        console.log('🙈 Barra de progresso escondida para CRONÔMETRO');
    } else {
        progressBar.style.display = 'block';
        progressFill.style.width = timerData.progress + '%';
        console.log('📊 Barra de progresso visível para TIMER - progresso:', timerData.progress + '%');
    }

    // Cycles/Info
    if (timerData.componentType === 'timer') {
        cyclesInfo.textContent = `Ciclo ${timerData.cycleCount}`;
        cyclesInfo.style.display = 'block';
    } else {
        // Para cronômetro, mostrar status ou tempo decorrido
        cyclesInfo.textContent = timerData.isRunning ? 'EM EXECUÇÃO' : 'PARADO';
        cyclesInfo.style.display = 'block';
    }

    // Botão toggle
    toggleBtn.innerHTML = timerData.isRunning ? '<i class="material-icons">pause</i>' : '<i class="material-icons">play_arrow</i>';
    toggleBtn.title = timerData.isRunning ? 'Pausar' : 'Iniciar';

    // Botão de visibilidade
    const visibilityBtn = document.getElementById('visibilityBtn');
    visibilityBtn.innerHTML = timerData.timerVisible ? '<i class="material-icons">visibility</i>' : '<i class="material-icons">visibility_off</i>';
    visibilityBtn.title = timerData.timerVisible ? 'Ocultar' : 'Mostrar';

    // Botão pular pausa - mostrar apenas durante pausas no timer
    if (timerData.componentType === 'timer' && 
        (timerData.phase === 'shortBreak' || timerData.phase === 'longBreak')) {
        skipBreakBtn.style.display = 'inline-block';
    } else {
        skipBreakBtn.style.display = 'none';
    }

    // Aplicar classe running
    if (timerData.isRunning) {
        timerContainer.classList.add('running');
        timerDisplay.classList.add('pulse');
    } else {
        timerContainer.classList.remove('running');
        timerDisplay.classList.remove('pulse');
    }
    
    console.log('✅ updateDisplay() concluído - Estado atual:', {
        componentType: timerData.componentType,
        formattedTime: timerData.formattedTime,
        isRunning: timerData.isRunning,
        classes: timerContainer.className
    });
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
    console.log('✅ window.electron.ipcRenderer disponível - registrando listener');
    
    window.electron.ipcRenderer.on('timer-data-update', (event, data) => {
        console.log('📥 Dados recebidos do timer:', data);
        console.log('🔄 componentType recebido:', data.componentType);
        console.log('⏱️ Tempo:', data.formattedTime);
        console.log('🏃 Rodando:', data.isRunning);
        
        // Atualizar timerData com novos dados
        const oldComponentType = timerData.componentType;
        timerData = { ...timerData, ...data };
        
        // Log se o componente mudou
        if (oldComponentType !== timerData.componentType) {
            console.log(`🔁 MUDANÇA DE COMPONENTE: ${oldComponentType} → ${timerData.componentType}`);
        }
        
        console.log('📊 timerData após atualização:', timerData);
        updateDisplay();
    });
    
    console.log('✅ Listener de timer-data-update registrado com sucesso');
    
    // Força atualização imediata - o sistema deve enviar dados atualizados
    console.log('📢 Forçando atualização inicial do pip-window');
    setTimeout(() => {
        console.log('⏰ Timeout executado - timerData atual:', timerData);
    }, 100);
} else {
    console.error('❌ window.electron.ipcRenderer NÃO disponível!');
    console.error('window.electron:', window.electron);
}

// Inicializar
console.log('🚀 Iniciando pip-window.js...');
console.log('📦 timerData inicial:', timerData);
updateDisplay();
console.log('✅ pip-window.js inicializado com sucesso');