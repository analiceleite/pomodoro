import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, interval, Subscription } from 'rxjs';
import { map, takeWhile, tap, filter, distinctUntilChanged } from 'rxjs/operators';

export interface TimerState {
  timeLeft: number;
  isRunning: boolean;
  currentPhase: 'work' | 'shortBreak' | 'longBreak';
  cycles: number;
  totalTimeForPhase: number;
}

@Injectable({
  providedIn: 'root'
})
export class TimerService {
  private workDuration = 25 * 60; // Default 25 minutes = 1500 seconds
  private readonly SHORT_BREAK_DURATION = 5 * 60; // 5 minutes = 300 seconds  
  private readonly LONG_BREAK_DURATION = 15 * 60; // 15 minutes = 900 seconds

  // Available work duration options in minutes
  private readonly WORK_DURATION_OPTIONS = [25, 45, 60]; // 25min, 30min, 1h

  private timerState$ = new BehaviorSubject<TimerState>({
    timeLeft: this.workDuration,
    isRunning: false,
    currentPhase: 'work',
    cycles: 0,
    totalTimeForPhase: this.workDuration
  });

  private timerSubscription?: Subscription;
  private onPhaseComplete$ = new BehaviorSubject<string>('');

  constructor() {}

  // Observables públicos
  get state$(): Observable<TimerState> {
    return this.timerState$.asObservable();
  }

  get phaseComplete$(): Observable<string> {
    return this.onPhaseComplete$.asObservable().pipe(
      filter(phase => phase !== '')
    );
  }

  get progress$(): Observable<number> {
    return this.timerState$.pipe(
      map(state => {
        const elapsed = state.totalTimeForPhase - state.timeLeft;
        return Math.min(100, Math.max(0, (elapsed / state.totalTimeForPhase) * 100));
      }),
      distinctUntilChanged()
    );
  }

  get formattedTime$(): Observable<string> {
    return this.timerState$.pipe(
      map(state => this.formatTime(state.timeLeft)),
      distinctUntilChanged()
    );
  }

  // Ações
  start(): void {
    if (this.timerState$.value.isRunning) return;

    this.updateState({ isRunning: true });
    
    this.timerSubscription = interval(1000).pipe(
      takeWhile(() => this.timerState$.value.isRunning),
      tap(() => this.tick())
    ).subscribe();
  }

  pause(): void {
    this.updateState({ isRunning: false });
    this.timerSubscription?.unsubscribe();
  }

  reset(): void {
    this.pause();
    this.updateState({
      timeLeft: this.workDuration,
      currentPhase: 'work',
      cycles: 0,
      totalTimeForPhase: this.workDuration
    });
  }

  // Reset completo do timer (usado quando dados são limpos)
  completeReset(): void {
    this.pause();
    this.timerSubscription?.unsubscribe();
    this.onPhaseComplete$.next(''); // Limpar notificações pendentes
    this.updateState({
      timeLeft: this.workDuration,
      currentPhase: 'work',
      cycles: 0,
      totalTimeForPhase: this.workDuration,
      isRunning: false
    });
  }

  // Métodos privados
  private tick(): void {
    const currentState = this.timerState$.value;
    
    if (currentState.timeLeft > 0) {
      this.updateState({ timeLeft: currentState.timeLeft - 1 });
    } else {
      this.nextPhase();
    }
  }

  private nextPhase(): void {
    const currentState = this.timerState$.value;
    let newPhase: 'work' | 'shortBreak' | 'longBreak';
    let newTimeLeft: number;
    let newCycles = currentState.cycles;

    if (currentState.currentPhase === 'work') {
      newCycles++;
      
      if (newCycles % 4 === 0) {
        newPhase = 'longBreak';
        newTimeLeft = this.LONG_BREAK_DURATION;
      } else {
        newPhase = 'shortBreak';
        newTimeLeft = this.SHORT_BREAK_DURATION;
      }
    } else {
      newPhase = 'work';
      newTimeLeft = this.workDuration;
    }

    this.updateState({
      currentPhase: newPhase,
      timeLeft: newTimeLeft,
      cycles: newCycles,
      totalTimeForPhase: newTimeLeft,
      isRunning: false
    });

    // Emit phase completion after state update
    setTimeout(() => {
      this.onPhaseComplete$.next(newPhase);
    }, 100);
  }

  private updateState(updates: Partial<TimerState>): void {
    const currentState = this.timerState$.value;
    this.timerState$.next({ ...currentState, ...updates });
  }

  private formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  // Getters para configurações
  getPhaseColor(phase: string): string {
    switch (phase) {
      case 'work': return '#e53935';
      case 'shortBreak': return '#43a047';
      case 'longBreak': return '#1e88e5';
      default: return '#e53935';
    }
  }

  getPhaseIcon(phase: string): string {
    switch (phase) {
      case 'work': return 'work';
      case 'shortBreak': return 'free_breakfast';
      case 'longBreak': return 'beach_access';
      default: return 'work';
    }
  }

  getPhaseTitle(phase: string): string {
    switch (phase) {
      case 'work': return 'Trabalho';
      case 'shortBreak': return 'Pausa Curta';
      case 'longBreak': return 'Pausa Longa';
      default: return 'Trabalho';
    }
  }

  // Configuration methods for work duration
  getAvailableWorkDurations(): number[] {
    return [...this.WORK_DURATION_OPTIONS];
  }

  getCurrentWorkDurationInMinutes(): number {
    return this.workDuration / 60;
  }

  setWorkDuration(minutes: number): void {
    // Allow custom durations between 1 and 120 minutes
    if (minutes >= 1 && minutes <= 120) {
      this.workDuration = minutes * 60;
      
      // Reset timer if not running to apply new duration
      if (!this.timerState$.value.isRunning) {
        const currentState = this.timerState$.value;
        if (currentState.currentPhase === 'work') {
          this.updateState({
            timeLeft: this.workDuration,
            totalTimeForPhase: this.workDuration
          });
        }
      }
      
      console.log(`🕐 Work duration set to ${minutes} minutes`);
    } else {
      console.warn(`Invalid work duration: ${minutes}. Must be between 1 and 120 minutes.`);
    }
  }

  isPresetDuration(minutes: number): boolean {
    return this.WORK_DURATION_OPTIONS.includes(minutes);
  }
}