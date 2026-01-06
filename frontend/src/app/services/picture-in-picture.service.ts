import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PictureInPictureService {
  private isInPiP$ = new BehaviorSubject<boolean>(false);
  private pipWindow: Window | null = null;

  get isInPictureInPicture$(): Observable<boolean> {
    return this.isInPiP$.asObservable();
  }

  async enterPictureInPicture(videoElement?: HTMLVideoElement): Promise<void> {
    try {
      // Método 1: Tentar Picture-in-Picture API nativo primeiro
      if (this.supportsPiPAPI()) {
        const video = this.createTimerVideo();
        await this.enterNativePiP(video);
        return;
      }

      // Método 2: Fallback para janela popup minimalista
      this.enterCleanPopupPiP();
    } catch (error) {
      console.error('Erro ao entrar em Picture-in-Picture:', error);
      this.enterCleanPopupPiP(); // Fallback
    }
  }

  exitPictureInPicture(): void {
    if (this.supportsPiPAPI() && document.pictureInPictureElement) {
      document.exitPictureInPicture();
    } else if (this.pipWindow) {
      this.pipWindow.close();
      this.pipWindow = null;
    }
    this.isInPiP$.next(false);
  }

  private supportsPiPAPI(): boolean {
    return 'pictureInPictureEnabled' in document;
  }

  private async enterNativePiP(videoElement: HTMLVideoElement): Promise<void> {
    if (document.pictureInPictureElement) {
      await document.exitPictureInPicture();
    }

    await videoElement.requestPictureInPicture();
    this.isInPiP$.next(true);

    // Listeners para eventos PiP
    videoElement.addEventListener('enterpictureinpicture', () => {
      this.isInPiP$.next(true);
    });

    videoElement.addEventListener('leavepictureinpicture', () => {
      this.isInPiP$.next(false);
    });
  }

  // Criar elemento de vídeo com canvas do timer para PiP nativo
  private createTimerVideo(): HTMLVideoElement {
    const canvas = document.createElement('canvas');
    canvas.width = 320;
    canvas.height = 200;
    
    const video = document.createElement('video');
    video.style.display = 'none';
    video.muted = true;
    video.loop = true;
    video.autoplay = true;
    
    // Criar stream do canvas
    const stream = canvas.captureStream(1);
    video.srcObject = stream;
    
    document.body.appendChild(video);
    video.play();
    
    // Remover quando sair do PiP
    video.addEventListener('leavepictureinpicture', () => {
      document.body.removeChild(video);
    });
    
    return video;
  }

  private enterCleanPopupPiP(): void {
    const windowFeatures = [
      'width=300',
      'height=280',
      'top=100',
      'left=' + (screen.width - 320),
      'resizable=no',
      'scrollbars=no',
      'toolbar=no',
      'menubar=no',
      'location=no',
      'directories=no',
      'status=no',
      'alwaysRaised=yes',
      'dependent=yes'
    ].join(',');

    // Use about:blank para URL limpa
    this.pipWindow = window.open('about:blank', 'PomodoroTimerPiP', windowFeatures);
    
    if (this.pipWindow) {
      this.setupCleanPopupWindow();
      this.isInPiP$.next(true);

      // Monitor fechamento da janela
      const checkClosed = setInterval(() => {
        if (this.pipWindow?.closed) {
          clearInterval(checkClosed);
          this.isInPiP$.next(false);
          this.pipWindow = null;
        }
      }, 1000);
    }
  }

  private setupCleanPopupWindow(): void {
    if (!this.pipWindow) return;

    const popupContent = `
    <!DOCTYPE html>
    <html>
    <head>
      <title>Pomodoro App</title>
      <meta charset="utf-8">
      <link href="https://fonts.googleapis.com/css2?family=Roboto+Mono:wght@400;700&display=swap" rel="stylesheet">
      <style>
        * {
          margin: 0;
          padding: 0;
          box-sizing: border-box;
        }
        body {
          font-family: 'Roboto Mono', monospace;
          background: #121212; 
          color: #e0e0e0; /* Light text for contrast */
          height: 100vh;
          display: flex;
          align-items: center;
          justify-content: center;
          user-select: none;
          overflow: hidden;
          position: relative;
        }
        .timer-container {
          text-align: center;
          padding: 20px;
          border-radius: 16px;
          background: #1e1e1e; /* Dark card background */
          box-shadow: 0 4px 20px rgba(0, 0, 0, 0.5);
          border-left: 4px solid var(--phase-color, #6964ba);
          transition: all 0.3s ease;
          min-width: 240px;
        }
        .timer-container.phase-work {
          background: linear-gradient(135deg, #3e3a5e 0%, #1e1e1e 100%);
          border-left-color: #6964ba;
        }
        .timer-container.phase-shortBreak {
          background: linear-gradient(135deg, #2e4a3e 0%, #1e1e1e 100%);
          border-left-color: #43a047;
        }
        .timer-container.phase-longBreak {
          background: linear-gradient(135deg, #2e3e4a 0%, #1e1e1e 100%);
          border-left-color: #1e88e5;
        }
        .close-btn {
          position: absolute;
          top: 8px;
          right: 8px;
          width: 20px;
          height: 20px;
          border: none;
          background: rgba(255, 255, 255, 0.1);
          color: #e0e0e0;
          border-radius: 50%;
          cursor: pointer;
          font-size: 14px;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.2s ease;
          opacity: 0.7;
        }
        .close-btn:hover {
          background: #ffffffff;
          color: white;
          opacity: 1;
          transform: scale(1.1);
        }
        .timer-display {
          font-size: 3rem;
          font-weight: 700;
          color: var(--phase-color, #e0e0e0);
          margin: 12px 0;
          letter-spacing: -2px;
        }
        .timer-display.pulse {
          animation: pulse 2s infinite;
        }
        .phase-indicator {
          font-size: 0.9rem;
          color: var(--phase-color, #b0b0b0);
          font-weight: 500;
          margin-bottom: 8px;
          text-transform: uppercase;
          letter-spacing: 1px;
        }
        .progress-bar {
          height: 3px;
          background: #333333; /* Darker progress bar background */
          border-radius: 2px;
          overflow: hidden;
          margin: 16px 0 8px 0;
        }
        .progress-fill {
          height: 100%;
          background: var(--phase-color, #6964ba);
          border-radius: 2px;
          transition: width 1s ease;
          width: 0%;
        }
        .cycles-info {
          font-size: 0.75rem;
          color: #b0b0b0;
          font-weight: 400;
          margin-bottom: 12px;
        }
        .controls {
          display: flex;
          justify-content: center;
          gap: 8px;
          margin-top: 12px;
        }
        .control-btn {
          width: 36px;
          height: 36px;
          border: none;
          border-radius: 50%;
          cursor: pointer;
          font-size: 16px;
          color: white;
          display: flex;
          align-items: center;
          justify-content: center;
          transition: all 0.3s ease;
          box-shadow: 0 2px 6px rgba(0, 0, 0, 0.5);
        }
        .control-btn:hover {
          transform: scale(1.05);
          box-shadow: 0 3px 8px rgba(0, 0, 0, 0.7);
        }
        .btn-primary {
          background: var(--phase-color, #6964ba);
        }
        .btn-accent {
          background: #f57c00;
        }
        .btn-warn {
          background: #f44336;
        }
        .btn-running {
          animation: pulse-btn 2s infinite;
        }
        @keyframes pulse-btn {
          0%, 100% { box-shadow: 0 2px 6px rgba(0, 0, 0, 0.5); }
          50% { box-shadow: 0 2px 10px rgba(105, 100, 186, 0.4); }
        }
        @keyframes pulse {
          0%, 100% { opacity: 1; transform: scale(1); }
          50% { opacity: 0.8; transform: scale(0.98); }
        }
        :root {
          --phase-color: #6964ba;
        }
      </style>
    </head>
    <body>
      <button class="close-btn" onclick="closeWindow()" title="Fechar">&times;</button>
      <div class="timer-container" id="timerContainer">
        <div class="phase-indicator" id="phaseIndicator">TRABALHO</div>
        <div class="timer-display" id="timerDisplay">25:00</div>
        <div class="progress-bar">
          <div class="progress-fill" id="progressFill"></div>
        </div>
        <div class="cycles-info" id="cyclesInfo">Ciclo 0</div>
        
        <div class="controls">
          <button class="control-btn btn-primary" onclick="sendAction('toggle')" id="toggleBtn" title="Play/Pause">
            <span id="toggleIcon">▶</span>
          </button>
          <button class="control-btn btn-warn" onclick="sendAction('reset')" title="Reset">
            <span>↻</span>
          </button>
        </div>
      </div>
      
      <script>
        const colors = {
          work: '#e53935',
          shortBreak: '#43a047', 
          longBreak: '#1e88e5'
        };
        
        const phases = {
          work: 'TRABALHO',
          shortBreak: 'PAUSA CURTA',
          longBreak: 'PAUSA LONGA'
        };

        window.addEventListener('message', (event) => {
          updateUI(event.data);
        });
        
        function updateUI(data) {
          if (!data) return;
          
          const container = document.getElementById('timerContainer');
          const phaseIndicator = document.getElementById('phaseIndicator');
          const timerDisplay = document.getElementById('timerDisplay');
          const progressFill = document.getElementById('progressFill');
          const cyclesInfo = document.getElementById('cyclesInfo');
          const toggleBtn = document.getElementById('toggleBtn');
          const toggleIcon = document.getElementById('toggleIcon');
          
          const phase = data.currentPhase || 'work';
          const color = colors[phase];
          const isRunning = data.isRunning || false;
          
          // Update phase styling
          container.className = 'timer-container phase-' + phase;
          document.documentElement.style.setProperty('--phase-color', color);
          
          // Update content
          phaseIndicator.textContent = phases[phase] || 'TRABALHO';
          timerDisplay.textContent = data.formattedTime || '25:00';
          timerDisplay.className = 'timer-display' + (isRunning ? ' pulse' : '');
          cyclesInfo.textContent = 'Ciclo ' + (data.cycles || 0);
          
          // Update progress bar
          const progress = Math.max(0, Math.min(100, data.progress || 0));
          progressFill.style.width = progress + '%';
          
          // Update toggle button state
          if (isRunning) {
            toggleBtn.className = 'control-btn btn-accent btn-running';
            toggleIcon.textContent = '⏸'; // pause symbol
            toggleBtn.title = 'Pausar';
          } else {
            toggleBtn.className = 'control-btn btn-primary';
            toggleIcon.textContent = '▶'; // play symbol
            toggleBtn.title = 'Iniciar';
          }
        }
        
        function sendAction(action) {
          if (window.opener && !window.opener.closed) {
            console.log('PiP sending action:', action);
            window.opener.postMessage({ action, source: 'pip' }, '*');
            
            // Feedback visual imediato
            if (action === 'toggle') {
              const btn = document.getElementById('toggleBtn');
              btn.style.transform = 'scale(0.95)';
              setTimeout(() => {
                btn.style.transform = 'scale(1)';
              }, 100);
            }
          } else {
            console.warn('Janela principal não disponível');
          }
        }

        
        function closeWindow() {
          sendAction('exitPiP');
        }
        
        // Setup inicial
        window.focus();
        
        // Auto-focus periódico (mais espaçado para não incomodar)
        setInterval(() => {
          if (!document.hasFocus()) {
            window.focus();
          }
        }, 20000);
        
        // Prevent context menu
        document.addEventListener('contextmenu', e => e.preventDefault());
        
        // Atalhos de teclado
        document.addEventListener('keydown', (e) => {
          switch(e.key) {
            case ' ':
            case 'Enter':
              e.preventDefault();
              sendAction('toggle');
              break;
            case 'r':
            case 'R':
              e.preventDefault();
              sendAction('reset');
              break;
            case 'Escape':
              closeWindow();
              break;
          }
        });
      </script>
    </body>
    </html>
    `;

    this.pipWindow.document.write(popupContent);
    this.pipWindow.document.close();
  }

  // Método para enviar dados para a janela PiP
  sendDataToPiP(data: any): void {
    if (this.pipWindow && !this.pipWindow.closed) {
      try {
        // Enviar dados com retry para garantir entrega
        this.pipWindow.postMessage(data, '*');
      } catch (error) {
        console.error('Erro ao enviar dados para PiP:', error);
      }
    }
  }

  // Verificar se PiP está ativo e responsável
  isPiPActive(): boolean {
    return this.pipWindow !== null && !this.pipWindow.closed;
  }

  // Método para processar mensagens recebidas do PiP
  processMessageFromPiP(action: string): void {
    switch (action) {
      case 'toggle':
        this.onActionFromPiP('toggle');
        break;
      case 'reset':
        this.onActionFromPiP('reset');
        break;
      case 'exitPiP':
        this.exitPictureInPicture();
        break;
      default:
        console.warn('Ação não reconhecida do PiP:', action);
    }
  }

  // Callback para ações recebidas do PiP
  private onActionFromPiP = (action: string) => {};

  // Método para definir callback de ações
  setActionCallback(callback: (action: string) => void): void {
    this.onActionFromPiP = callback;
  }

}