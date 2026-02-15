import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject, of } from 'rxjs';
import { tap, map, catchError, delay, retry } from 'rxjs/operators';
import { EnvironmentService } from './environment.service';

@Injectable({
  providedIn: 'root'  // Garantir que seja singleton global
})
export class PomodoroService {
  private apiUrl: string;
  private cycleCompleted$ = new Subject<void>();
  private dataCleared$ = new Subject<void>();

  constructor(
    private http: HttpClient,
    private environmentService: EnvironmentService
  ) {
    this.apiUrl = `${this.environmentService.getApiUrl()}/pomodoro`;
    console.log('🔄 PomodoroService inicializado com URL:', this.apiUrl);
  }

  // Observable para notificar quando um ciclo é completado
  get onCycleCompleted(): Observable<void> {
    return this.cycleCompleted$.asObservable();
  }

  // Observable para notificar quando dados são limpos
  get onDataCleared(): Observable<void> {
    return this.dataCleared$.asObservable();
  }

  recordCycle(durationMinutes?: number, sessionType?: string): Observable<any> {
    const payload = {
      ...(durationMinutes !== undefined && { durationMinutes }),
      ...(sessionType !== undefined && { sessionType })
    };
    return this.http.post(`${this.apiUrl}/cycle`, payload).pipe(
      retry(2),
      tap({
        next: (response) => {
          this.cycleCompleted$.next();
          console.log('✅ Ciclo registrado com sucesso');
        },
        error: (error) => {
          console.error('❌ Erro ao registrar ciclo:', error);
        }
      })
    );
  }

  getTodayStats(): Observable<any> {
    return this.http.get<any[]>(`${this.apiUrl}/stats`).pipe(
      retry(2),
      map((stats: any[]) => {
        const today = new Date().toISOString().split('T')[0];
        const todayData = stats.find(stat => stat.date === today);
        return todayData || { cycles: 0, totalMinutes: 0, hours: 0 };
      }),
      catchError(() => of({ cycles: 0, totalMinutes: 0, hours: 0 }))
    );
  }

  getStats(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/stats`).pipe(
      retry(2),
      catchError(() => of([]))
    );
  }

  // Limpar todos os dados
  clearAllData(): Observable<any> {
    return this.http.delete(`${this.apiUrl}/clear`).pipe(
      retry(1),
      tap({
        next: (response) => {
          this.dataCleared$.next();
          console.log('🗑️ Dados limpos');
        },
        error: (error) => {
          console.error('❌ Erro ao limpar dados:', error);
        }
      })
    );
  }

  // Exportar todos os dados
  exportData(): Observable<any> {
    return this.http.get(`${this.apiUrl}/export`).pipe(
      retry(1)
    );
  }
}