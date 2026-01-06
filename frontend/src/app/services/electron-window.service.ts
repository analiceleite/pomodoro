import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, from } from 'rxjs';
import { map, catchError } from 'rxjs/operators';

export interface DisplayInfo {
  id: number;
  index: number;
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  workArea: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  primary: boolean;
}

export interface WindowInfo {
  bounds: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
  display: DisplayInfo;
  isMaximized: boolean;
}

@Injectable({
  providedIn: 'root'
})
export class ElectronWindowService {
  private displays$ = new BehaviorSubject<DisplayInfo[]>([]);
  private currentWindowInfo$ = new BehaviorSubject<WindowInfo | null>(null);
  private isElectron = false;

  constructor() {
    this.checkElectronEnvironment();
    if (this.isElectron) {
      this.loadDisplayInfo();
      this.loadWindowInfo();
    }
  }

  // Observables públicos
  get availableDisplays$(): Observable<DisplayInfo[]> {
    return this.displays$.asObservable();
  }

  get windowInfo$(): Observable<WindowInfo | null> {
    return this.currentWindowInfo$.asObservable();
  }

  get isRunningInElectron(): boolean {
    return this.isElectron;
  }

  // Carregar informações dos monitores
  async loadDisplayInfo(): Promise<DisplayInfo[]> {
    if (!this.isElectron) return [];

    try {
      const displays = await (window as any).electron?.ipcRenderer?.invoke('get-displays') || [];
      this.displays$.next(displays);
      return displays;
    } catch (error) {
      console.error('Erro ao carregar informações dos monitores:', error);
      return [];
    }
  }

  // Carregar informações da janela atual
  async loadWindowInfo(): Promise<WindowInfo | null> {
    if (!this.isElectron) return null;

    try {
      const windowInfo = await (window as any).electron?.ipcRenderer?.invoke('get-window-position') || null;
      this.currentWindowInfo$.next(windowInfo);
      return windowInfo;
    } catch (error) {
      console.error('Erro ao carregar informações da janela:', error);
      return null;
    }
  }

  // Mover janela para monitor específico
  async moveToDisplay(displayIndex: number): Promise<boolean> {
    if (!this.isElectron) {
      console.warn('Funcionalidade disponível apenas no Electron');
      return false;
    }

    try {
      const result = await (window as any).electron?.ipcRenderer?.invoke('move-to-display', displayIndex);
      await this.loadWindowInfo(); // Atualizar informações da janela
      return result || false;
    } catch (error) {
      console.error('Erro ao mover janela para monitor:', error);
      return false;
    }
  }

  // Mover para o próximo monitor
  async moveToNextDisplay(): Promise<boolean> {
    if (!this.isElectron) {
      console.warn('Funcionalidade disponível apenas no Electron');
      return false;
    }

    try {
      const result = await (window as any).electron?.ipcRenderer?.invoke('move-to-next-display');
      await this.loadWindowInfo(); // Atualizar informações da janela
      return result || false;
    } catch (error) {
      console.error('Erro ao mover janela para próximo monitor:', error);
      return false;
    }
  }

  // Alternar maximizar janela
  async toggleMaximize(): Promise<boolean> {
    if (!this.isElectron) {
      console.warn('Funcionalidade disponível apenas no Electron');
      return false;
    }

    try {
      const isMaximized = await (window as any).electron?.ipcRenderer?.invoke('toggle-maximize');
      await this.loadWindowInfo(); // Atualizar informações da janela
      return isMaximized || false;
    } catch (error) {
      console.error('Erro ao alternar maximizar janela:', error);
      return false;
    }
  }

  // Obter monitor atual
  getCurrentDisplayIndex(): number {
    const windowInfo = this.currentWindowInfo$.value;
    return windowInfo?.display?.index ?? 0;
  }

  // Verificar se está em monitor específico
  isOnDisplay(displayIndex: number): boolean {
    return this.getCurrentDisplayIndex() === displayIndex;
  }

  // Verificar se janela está maximizada
  isMaximized(): boolean {
    const windowInfo = this.currentWindowInfo$.value;
    return windowInfo?.isMaximized ?? false;
  }

  // Obter número total de monitores
  getDisplayCount(): number {
    return this.displays$.value.length;
  }

  // Métodos de conveniência
  async moveToMainDisplay(): Promise<boolean> {
    const displays = this.displays$.value;
    const mainDisplayIndex = displays.findIndex(display => display.primary);
    return this.moveToDisplay(mainDisplayIndex >= 0 ? mainDisplayIndex : 0);
  }

  async moveToSecondaryDisplay(): Promise<boolean> {
    const displays = this.displays$.value;
    const secondaryDisplayIndex = displays.findIndex((display, index) => !display.primary && index > 0);
    return this.moveToDisplay(secondaryDisplayIndex >= 0 ? secondaryDisplayIndex : 1);
  }

  // Métodos privados
  private checkElectronEnvironment(): void {
    this.isElectron = !!(window && (window as any).electron);
    if (!this.isElectron) {
      console.log('Aplicação rodando no navegador - funcionalidades de janela desabilitadas');
    }
  }

  // Detectar mudanças de monitor (polling)
  startMonitoringDisplayChanges(intervalMs: number = 2000): void {
    if (!this.isElectron) return;

    setInterval(async () => {
      await this.loadDisplayInfo();
      await this.loadWindowInfo();
    }, intervalMs);
  }
}