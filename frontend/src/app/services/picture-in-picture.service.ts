import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ElectronAPI } from './types/electron.types';

// Definição de tipos para as APIs do Electron
declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

@Injectable({
  providedIn: 'root'
})
export class PictureInPictureService {
  // Estado da janela Picture-in-Picture
  private isInPiP$ = new BehaviorSubject<boolean>(false);

  // Dimensões da janela PiP
  private pipDimensions: { width: number; height: number } | null = null;

  // Flags de controle
  private isElectron = false;
  private actionCallback?: (action: string) => void;

  constructor() {
    // Aguardar um pouco para o preload script carregar
    setTimeout(() => {
      this.isElectron = this.checkElectron();
      if (this.isElectron) {
        this.setupElectronListeners();
        console.log('✅ PictureInPictureService inicializado com Electron');
      } else {
        console.warn('⚠️ Electron não detectado. Picture-in-Picture não estará disponível.');
      }
    }, 100);
  }

  // =========================
  // PROPRIEDADES PÚBLICAS
  // =========================

  get isInPictureInPicture$(): Observable<boolean> {
    return this.isInPiP$.asObservable();
  }

  setPiPDimensions(width: number, height: number): void {
    this.pipDimensions = { width, height };
  }

  // =========================
  // MÉTODOS PRINCIPAIS
  // =========================

  async enterPictureInPicture(width?: number, height?: number): Promise<void> {
    if (!this.isElectron || !(window as any)?.electronAPI) {
      console.error('❌ Electron PiP não disponível');
      return;
    }

    // Usar dimensões fornecidas ou armazenadas
    const w = width || this.pipDimensions?.width;
    const h = height || this.pipDimensions?.height;

    try {
      console.log('🖼️ Criando janela Picture-in-Picture com Electron (always-on-top)');
      const success = await (window as any).electronAPI.openPiP();

      if (success) {
        this.isInPiP$.next(true);
        console.log('✅ Janela Picture-in-Picture criada com sucesso (sempre no topo)');
      } else {
        console.error('❌ Falha ao criar janela Picture-in-Picture');
      }
    } catch (error) {
      console.error('❌ Erro ao entrar em Picture-in-Picture:', error);
    }
  }

  exitPictureInPicture(): void {
    if (!this.isElectron || !(window as any)?.electronAPI) {
      console.warn('⚠️ Electron PiP não disponível para fechar');
      return;
    }

    try {
      console.log('🚪 Fechando janela Picture-in-Picture do Electron');
      (window as any).electronAPI.closePiP();
      this.isInPiP$.next(false);
    } catch (error) {
      console.error('❌ Erro ao fechar Picture-in-Picture:', error);
    }
  }

  async sendDataToPiP(data: any): Promise<void> {
    if (!this.isPiPActive() || !this.isElectron || !(window as any)?.electronAPI) {
      return;
    }

    try {
      // Mapear dados para o formato esperado pela janela PiP
      const pipData = {
        phase: data.currentPhase || 'work',
        timeRemaining: data.timeLeft || 0,
        isRunning: data.isRunning || false,
        progress: data.progress || 0,
        formattedTime: data.formattedTime || '00:00',
        cycleCount: (data.cycles || 0) + 1
      };
      
      await (window as any).electronAPI.sendDataToPiP(pipData);
    } catch (error) {
      console.error('❌ Erro ao enviar dados para Picture-in-Picture:', error);
    }
  }

  // =========================
  // GERENCIAMENTO DE AÇÕES
  // =========================

  setActionCallback(callback: (action: string) => void): void {
    this.actionCallback = callback;
  }

  processMessageFromPiP(action: string): void {
    if (this.actionCallback) {
      this.actionCallback(action);
    }
  }

  // =========================
  // UTILITÁRIOS
  // =========================

  isPiPActive(): boolean {
    return this.isInPiP$.value;
  }

  isElectronAvailable(): boolean {
    return this.isElectron;
  }

  // =========================
  // MÉTODOS PRIVADOS
  // =========================

  private checkElectron(): boolean {
    const hasElectronAPI = !!(window as any)?.electronAPI;
    console.log('🔍 Verificando Electron API:', {
      hasElectronAPI,
      window: typeof window,
      electronAPI: typeof (window as any)?.electronAPI
    });
    return hasElectronAPI;
  }

  private setupElectronListeners(): void {
    if (!(window as any)?.electronAPI) {
      console.warn('⚠️ Electron API não disponível');
      return;
    }

    // Escutar quando a janela PiP é fechada
    (window as any).electronAPI.onPipWindowClosed(() => {
      console.log('🖼️ Janela Picture-in-Picture foi fechada');
      this.isInPiP$.next(false);
    });

    // Escutar ações vindas da janela PiP
    (window as any).electronAPI.onPipActionReceived((action: string) => {
      console.log('🎬 Ação recebida do Picture-in-Picture:', action);
      if (this.actionCallback) {
        this.actionCallback(action);
      }
    });
  }
}