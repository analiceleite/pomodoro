import { Injectable } from '@angular/core';
import { BehaviorSubject, Observable, Subject, interval, Subscription } from 'rxjs';
import { map, takeWhile, tap, filter } from 'rxjs/operators';
import { TimerConfigService } from './timer-config.service';
import { TimerUiService } from './timer-ui.service';
import { TimerState, createInitialState } from './timer-state';
import { NotificationService } from '../notification.service';
import { PomodoroService } from '../pomodoro.service';

@Injectable({ providedIn: 'root' })
export class TimerEngineService {
  private timerState$: BehaviorSubject<TimerState>;
  private timerSubscription?: Subscription;
  private onPhaseComplete$ = new Subject<string>();

  constructor(
    private config: TimerConfigService,
    private ui: TimerUiService,
    private notificationService: NotificationService,
    private pomodoroService: PomodoroService
  ) {
    this.timerState$ = new BehaviorSubject<TimerState>(createInitialState(this.config.getWorkDurationSeconds()));
  }

  get state$(): Observable<TimerState> {
    return this.timerState$.asObservable();
  }

  get phaseComplete$(): Observable<string> {
    return this.onPhaseComplete$.asObservable();
  }

  get progress$(): Observable<number> {
    return this.timerState$.pipe(
      map(state => {
        const elapsed = state.totalTimeForPhase - state.timeLeft;
        return Math.min(100, Math.max(0, (elapsed / state.totalTimeForPhase) * 100));
      })
    );
  }

  get formattedTime$(): Observable<string> {
    return this.timerState$.pipe(map(state => this.ui.formatTime(state.timeLeft)));
  }

  start(): void {
    if (this.timerState$.value.isRunning) return;

    this.updateState({ isRunning: true, userStarted: true });

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
      timeLeft: this.config.getWorkDurationSeconds(),
      currentPhase: 'work',
      totalTimeForPhase: this.config.getWorkDurationSeconds(),
      userStarted: false
    });
  }

  completeReset(): void {
    this.pause();
    this.timerSubscription?.unsubscribe();
    // Don't emit a clearing event here — Subject does not retain state, so no need to clear
    this.updateState({
      timeLeft: this.config.getWorkDurationSeconds(),
      currentPhase: 'work',
      cycles: 0,
      totalTimeForPhase: this.config.getWorkDurationSeconds(),
      isRunning: false,
      userStarted: false
    });
  }

  skipBreak(): void {
    const current = this.timerState$.value;
    if (current.currentPhase === 'shortBreak' || current.currentPhase === 'longBreak') {
      this.pause();
      this.updateState({
        currentPhase: 'work',
        timeLeft: this.config.getWorkDurationSeconds(),
        totalTimeForPhase: this.config.getWorkDurationSeconds(),
        isRunning: false
      });
    }
  }

  // Internal logic
  private tick(): void {
    const current = this.timerState$.value;
    if (current.timeLeft > 0) {
      this.updateState({ timeLeft: current.timeLeft - 1 });
    } else {
      this.nextPhase();
    }
  }

  private nextPhase(): void {
    const current = this.timerState$.value;
    let newPhase: 'work' | 'shortBreak' | 'longBreak';
    let newTimeLeft: number;
    let newCycles = current.cycles;

    if (current.currentPhase === 'work') {
      newCycles++;
      if (newCycles % 4 === 0) {
        newPhase = 'longBreak';
        newTimeLeft = this.config.LONG_BREAK_DURATION;
      } else {
        newPhase = 'shortBreak';
        newTimeLeft = this.config.SHORT_BREAK_DURATION;
      }
    } else {
      newPhase = 'work';
      newTimeLeft = this.config.getWorkDurationSeconds();
    }

    this.updateState({
      currentPhase: newPhase,
      timeLeft: newTimeLeft,
      cycles: newCycles,
      totalTimeForPhase: newTimeLeft,
      isRunning: false
    });

    if (current.userStarted) {
      setTimeout(() => {
        this.onPhaseComplete$.next(newPhase);

        // Trigger notification when a cycle (work phase) is completed
        if (current.currentPhase === 'work') {
          this.notificationService.showPhaseNotification('work').subscribe({
            next: (shown) => {
              if (!shown) {
                console.log('📢 Notification not shown for completed work cycle');
              }
            
            },
            error: (err) => console.error('❌ Notification error:', err)
          });
        }

        // Record cycle when entering breaks
        if (newPhase === 'shortBreak' || newPhase === 'longBreak') {
          const duration = this.getCurrentWorkDurationInMinutes();
          this.pomodoroService.recordCycle(duration, 'pomodoro').subscribe({
            next: () => console.log('✅ Cycle recorded (engine)'),
            error: (err) => console.error('❌ Error recording cycle from engine:', err)
          });
        }
      }, 100);
    }
  }

  private updateState(updates: Partial<TimerState>): void {
    const currentState = this.timerState$.value;
    this.timerState$.next({ ...currentState, ...updates });
  }

  // Expose helper getters
  getCurrentWorkDurationInMinutes(): number {
    return this.config.getCurrentWorkDurationInMinutes();
  }

  getAvailableWorkDurations(): number[] {
    return this.config.getAvailableWorkDurations();
  }

  setWorkDuration(minutes: number): void {
    this.config.setWorkDuration(minutes);
    // If currently in work phase and not running, update timers
    const state = this.timerState$.value;
    if (!state.isRunning && state.currentPhase === 'work') {
      this.updateState({ timeLeft: this.config.getWorkDurationSeconds(), totalTimeForPhase: this.config.getWorkDurationSeconds() });
    }
  }

  isPresetDuration(minutes: number): boolean {
    return this.config.isPresetDuration(minutes);
  }
}