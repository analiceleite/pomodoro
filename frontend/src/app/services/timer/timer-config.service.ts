import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TimerConfigService {
  private workDuration = 25 * 60; // seconds
  readonly SHORT_BREAK_DURATION = 5 * 60;
  readonly LONG_BREAK_DURATION = 15 * 60;
  readonly WORK_DURATION_OPTIONS = [25, 45, 60];

  getWorkDurationSeconds(): number {
    return this.workDuration;
  }

  getCurrentWorkDurationInMinutes(): number {
    return this.workDuration / 60;
  }

  getAvailableWorkDurations(): number[] {
    return [...this.WORK_DURATION_OPTIONS];
  }

  setWorkDuration(minutes: number): void {
    if (minutes >= 1 && minutes <= 120) {
      this.workDuration = minutes * 60;
      console.log(`🕐 Work duration updated to ${minutes} minutes`);
    } else {
      console.warn('Invalid work duration:', minutes);
    }
  }

  isPresetDuration(minutes: number): boolean {
    return this.WORK_DURATION_OPTIONS.includes(minutes);
  }
}