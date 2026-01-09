import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { TimerEngineService } from './timer/timer-engine.service';
import { TimerUiService } from './timer/timer-ui.service';
import { TimerConfigService } from './timer/timer-config.service';

@Injectable({ providedIn: 'root' })
export class TimerService {
  constructor(
    private engine: TimerEngineService,
    private ui: TimerUiService,
    private config: TimerConfigService
  ) {}

  // Observables
  get state$() { return this.engine.state$; }
  get phaseComplete$(): Observable<string> { return this.engine.phaseComplete$; }
  get progress$() { return this.engine.progress$; }
  get formattedTime$() { return this.engine.formattedTime$; }

  // Controls
  start(): void { this.engine.start(); }
  pause(): void { this.engine.pause(); }
  reset(): void { this.engine.reset(); }
  completeReset(): void { this.engine.completeReset(); }
  skipBreak(): void { this.engine.skipBreak(); }

  // Config delegations
  getAvailableWorkDurations(): number[] { return this.config.getAvailableWorkDurations(); }
  getCurrentWorkDurationInMinutes(): number { return this.config.getCurrentWorkDurationInMinutes(); }
  setWorkDuration(minutes: number): void { this.engine.setWorkDuration(minutes); }
  isPresetDuration(minutes: number): boolean { return this.config.isPresetDuration(minutes); }

  // UI helpers
  getPhaseColor(phase: string): string { return this.ui.getPhaseColor(phase); }
  getPhaseIcon(phase: string): string { return this.ui.getPhaseIcon(phase); }
  getPhaseTitle(phase: string): string { return this.ui.getPhaseTitle(phase); }
}