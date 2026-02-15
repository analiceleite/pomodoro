import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, interval, Subscription } from 'rxjs';
import { map, takeWhile, tap } from 'rxjs/operators';
import { StopwatchUiService } from './stopwatch-ui.service';
import { StopwatchState, createInitialState } from './stopwatch-state';
import { PomodoroService } from '../pomodoro.service';

@Injectable({ providedIn: 'root' })
export class StopwatchEngineService {
  private stopwatchState$: BehaviorSubject<StopwatchState>;
  private stopwatchSubscription?: Subscription;

  // Threshold para considerar uma sessão como ciclo (15 minutos = 900 segundos)
  private readonly CYCLE_THRESHOLD_SECONDS = 900;
  // Mínimo de tempo para registrar uma sessão (1 minuto = 60 segundos)
  private readonly MIN_SESSION_DURATION_SECONDS = 60;

  constructor(
    private ui: StopwatchUiService,
    private pomodoroService: PomodoroService
  ) {
    this.stopwatchState$ = new BehaviorSubject<StopwatchState>(createInitialState());
  }

  get state$(): Observable<StopwatchState> {
    return this.stopwatchState$.asObservable();
  }

  get progress$(): Observable<number> {
    return this.stopwatchState$.pipe(
      map(state => {
        // Progresso baseado no tempo decorrido (0-100%)
        // Para o cronômetro, usaremos um máximo de 2 horas (7200 segundos) como referência
        const maxSeconds = 7200;
        return Math.min(100, (state.elapsedSeconds / maxSeconds) * 100);
      })
    );
  }

  get formattedTime$(): Observable<string> {
    return this.stopwatchState$.pipe(map(state => this.ui.formatTime(state.elapsedSeconds)));
  }

  start(): void {
    const currentState = this.stopwatchState$.value;
    if (currentState.isRunning) return;

    this.updateState({ isRunning: true, isPaused: false });

    this.stopwatchSubscription = interval(1000).pipe(
      takeWhile(() => this.stopwatchState$.value.isRunning),
      tap(() => this.tick())
    ).subscribe();
  }

  pause(): void {
    this.updateState({ isRunning: false, isPaused: true });
    this.stopwatchSubscription?.unsubscribe();
  }

  resume(): void {
    const currentState = this.stopwatchState$.value;
    if (currentState.isRunning || !currentState.isPaused) return;

    this.updateState({ isRunning: true, isPaused: false });

    this.stopwatchSubscription = interval(1000).pipe(
      takeWhile(() => this.stopwatchState$.value.isRunning),
      tap(() => this.tick())
    ).subscribe();
  }

  reset(): void {
    this.pause();
    this.updateState(createInitialState());
  }

  // Finalizar a sessão e registrar no backend
  finishSession(): void {
    this.pause();
    const currentState = this.stopwatchState$.value;

    // Validar duração mínima
    if (currentState.elapsedSeconds < this.MIN_SESSION_DURATION_SECONDS) {
      console.warn(`⚠️ Sessão muito curta (${currentState.elapsedSeconds}s). Mínimo necessário: ${this.MIN_SESSION_DURATION_SECONDS}s`);
      alert('Sessão muito curta. Mínimo de 1 minuto necessário para registrar.');
      this.updateState(createInitialState());
      return;
    }

    if (currentState.elapsedSeconds > 0) {
      const elapsedMinutes = Math.round(currentState.elapsedSeconds / 60 * 100) / 100;
      
      // Registrar a sessão como stopwatch
      this.pomodoroService.recordCycle(elapsedMinutes, 'stopwatch').subscribe({
        next: () => {
          console.log(`✅ Sessão de cronômetro registrada: ${elapsedMinutes} minutos`);
          
          // Se duração > 15 minutos, avaliar como ciclo
          if (currentState.elapsedSeconds > this.CYCLE_THRESHOLD_SECONDS) {
            console.log(`✨ Sessão de cronômetro contará como um ciclo automaticamente`);
          }

          // Resetar o estado sem chamar pause() novamente
          this.updateState(createInitialState());
        },
        error: (error) => {
          console.error('❌ Erro ao registrar sessão de cronômetro:', error);
        }
      });
    } else {
      console.log('⚠️ Nenhum tempo decorrido para registrar');
      this.updateState(createInitialState());
    }
  }

  private tick(): void {
    const current = this.stopwatchState$.value;
    this.updateState({ elapsedSeconds: current.elapsedSeconds + 1 });
  }

  private updateState(partialState: Partial<StopwatchState>): void {
    const currentState = this.stopwatchState$.value;
    this.stopwatchState$.next({ ...currentState, ...partialState });
  }
}
