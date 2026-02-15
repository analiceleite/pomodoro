import { Injectable } from '@angular/core';
import { Observable } from 'rxjs';
import { StopwatchEngineService } from './stopwatch/stopwatch-engine.service';
import { StopwatchUiService } from './stopwatch/stopwatch-ui.service';

@Injectable({ providedIn: 'root' })
export class StopwatchService {
  constructor(
    private engine: StopwatchEngineService,
    private ui: StopwatchUiService
  ) {}

  // Observables
  get state$() { return this.engine.state$; }
  get progress$() { return this.engine.progress$; }
  get formattedTime$() { return this.engine.formattedTime$; }

  // Controls
  start(): void { this.engine.start(); }
  pause(): void { this.engine.pause(); }
  resume(): void { this.engine.resume(); }
  reset(): void { this.engine.reset(); }
  finishSession(): void { this.engine.finishSession(); }

  // UI helpers
  getStopwatchColor(): string { return this.ui.getStopwatchColor(); }
  getStopwatchIcon(): string { return this.ui.getStopwatchIcon(); }
  getStopwatchTitle(): string { return this.ui.getStopwatchTitle(); }
  formatDuration(seconds: number): string { return this.ui.formatDuration(seconds); }
}
