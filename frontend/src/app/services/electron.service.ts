import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable } from 'rxjs';
import { ElectronAPI } from './types/electron.types';

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

@Injectable({
  providedIn: 'root'
})
export class ElectronService {
  private alwaysOnTopState$ = new BehaviorSubject<boolean>(false);
  private isElectron = false;

  constructor() {
    this.isElectron = this.checkElectron();
    if (this.isElectron) {
      this.initializeAlwaysOnTopState();
    }
  }

  // Observable para estado do always-on-top
  get alwaysOnTopState(): Observable<boolean> {
    return this.alwaysOnTopState$.asObservable();
  }

  // Verificar se está rodando no Electron
  private checkElectron(): boolean {
    return !!(window && (window as any).electronAPI);
  }

  // Verificar se Electron está disponível
  isElectronAvailable(): boolean {
    return this.isElectron;
  }

  // Inicializar estado do always-on-top
  private async initializeAlwaysOnTopState(): Promise<void> {
    if (this.isElectron && (window as any)?.electronAPI) {
      try {
        const status = await (window as any).electronAPI.getAlwaysOnTopStatus();
        this.alwaysOnTopState$.next(status);
      } catch (error) {
        console.error('Erro ao obter status do always-on-top:', error);
      }
    }
  }

  // Toggle always-on-top
  async toggleAlwaysOnTop(): Promise<boolean> {
    if (!this.isElectron || !(window as any)?.electronAPI) {
      console.warn('Electron não disponível - always-on-top não suportado');
      return false;
    }

    try {
      const newStatus = await (window as any).electronAPI.toggleAlwaysOnTop();
      this.alwaysOnTopState$.next(newStatus);
      console.log(`🔝 Always on top ${newStatus ? 'ATIVADO' : 'DESATIVADO'}`);
      return newStatus;
    } catch (error) {
      console.error('Erro ao alternar always-on-top:', error);
      return false;
    }
  }

  // Definir always-on-top
  async setAlwaysOnTop(enable: boolean): Promise<boolean> {
    if (!this.isElectron || !(window as any)?.electronAPI) {
      console.warn('Electron não disponível - always-on-top não suportado');
      return false;
    }

    try {
      const newStatus = await (window as any).electronAPI.setAlwaysOnTop(enable);
      this.alwaysOnTopState$.next(newStatus);
      console.log(`🔝 Always on top ${newStatus ? 'ATIVADO' : 'DESATIVADO'}`);
      return newStatus;
    } catch (error) {
      console.error('Erro ao definir always-on-top:', error);
      return false;
    }
  }

  // Obter status atual
  async getAlwaysOnTopStatus(): Promise<boolean> {
    if (!this.isElectron || !(window as any)?.electronAPI) {
      return false;
    }

    try {
      const status = await (window as any).electronAPI.getAlwaysOnTopStatus();
      this.alwaysOnTopState$.next(status);
      return status;
    } catch (error) {
      console.error('Erro ao obter status do always-on-top:', error);
      return false;
    }
  }
}