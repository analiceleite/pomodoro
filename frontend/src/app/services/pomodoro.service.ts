import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'  // Garantir que seja singleton global
})
export class PomodoroService {
  private apiUrl = 'http://localhost:3000/pomodoro';
  private cycleCompleted$ = new Subject<void>();
  private dataCleared$ = new Subject<void>();

  constructor(private http: HttpClient) {
    console.log('🔄 PomodoroService inicializado');
  }

  // Observable para notificar quando um ciclo é completado
  get onCycleCompleted(): Observable<void> {
    return this.cycleCompleted$.asObservable();
  }

  // Observable para notificar quando dados são limpos
  get onDataCleared(): Observable<void> {
    return this.dataCleared$.asObservable();
  }

  recordCycle(): Observable<any> {
    return this.http.post(`${this.apiUrl}/cycle`, {}).pipe(
      tap({
        next: (response) => {
          // Notificar que um ciclo foi completado após sucesso
          this.cycleCompleted$.next();
          console.log('✅ Ciclo registrado com sucesso - notificação enviada para atualizar estatísticas');
        },
        error: (error) => {
          console.error('❌ Erro ao registrar ciclo:', error);
        }
      })
    );
  }

  getStats(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/stats`);
  }

  // Limpar todos os dados
  clearAllData(): Observable<any> {
    return this.http.delete(`${this.apiUrl}/clear`).pipe(
      tap({
        next: (response) => {
          // Notificar que os dados foram limpos
          this.dataCleared$.next();
          console.log('🗑️ Dados limpos - notificação enviada para resetar timer');
        },
        error: (error) => {
          console.error('❌ Erro ao limpar dados:', error);
        }
      })
    );
  }

  // Exportar todos os dados
  exportData(): Observable<any> {
    return this.http.get(`${this.apiUrl}/export`);
  }
}