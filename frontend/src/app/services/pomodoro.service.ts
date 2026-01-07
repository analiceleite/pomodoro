import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, Subject } from 'rxjs';
import { tap } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class PomodoroService {
  private apiUrl = 'http://localhost:3000/pomodoro';
  private cycleCompleted$ = new Subject<void>();

  constructor(private http: HttpClient) {}

  // Observable para notificar quando um ciclo é completado
  get onCycleCompleted(): Observable<void> {
    return this.cycleCompleted$.asObservable();
  }

  recordCycle(): Observable<any> {
    return this.http.post(`${this.apiUrl}/cycle`, {}).pipe(
      tap((response) => {
        // Notificar que um ciclo foi completado após sucesso
        this.cycleCompleted$.next();
        console.log('Ciclo registrado e notificação enviada');
      })
    );
  }

  getStats(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/stats`);
  }
}