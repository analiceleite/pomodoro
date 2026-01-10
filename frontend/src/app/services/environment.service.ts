import { Injectable } from '@angular/core';

@Injectable({
  providedIn: 'root'
})
export class EnvironmentService {
  private readonly isElectron: boolean;
  private readonly apiUrl: string;

  constructor() {
    // Detectar se está rodando no Electron
    this.isElectron = !!(window as any).electronAPI || navigator.userAgent.toLowerCase().includes('electron');
    
    // Configurar URL da API baseado no ambiente
    if (this.isElectron) {
      // No Electron, sempre usar localhost:3000 pois o backend roda localmente
      this.apiUrl = 'http://localhost:3000';
    } else {
      // No navegador, usar a URL atual ou uma URL específica
      this.apiUrl = 'http://localhost:3000'; // ou window.location.origin se houver proxy
    }
    
    console.log('🔧 Ambiente detectado:', {
      isElectron: this.isElectron,
      apiUrl: this.apiUrl,
      userAgent: navigator.userAgent
    });
  }

  getApiUrl(): string {
    return this.apiUrl;
  }

  isRunningInElectron(): boolean {
    return this.isElectron;
  }
}