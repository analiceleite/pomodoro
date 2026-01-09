import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class TimerUiService {
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

  formatTime(seconds: number): string {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  }

  formatDurationLabel(minutes: number): string {
    if (minutes >= 60) {
      const hours = Math.floor(minutes / 60);
      const remainingMinutes = minutes % 60;

      if (remainingMinutes === 0) {
        return `${hours}h`;
      }
      return `${hours}h ${remainingMinutes}min`;
    }
    return `${minutes} minutos`;
  }

  formatTotalTime(totalMinutes: number): string {
    const roundedMinutes = Math.round(totalMinutes * 100) / 100;

    if (roundedMinutes >= 60) {
      const hours = Math.floor(roundedMinutes / 60);
      const minutes = Math.round(roundedMinutes % 60);

      if (minutes === 0) {
        return `${hours}h`;
      }
      return `${hours}h${minutes}m`;
    }

    if (roundedMinutes < 1) {
      const seconds = Math.round(roundedMinutes * 60);
      return `${seconds}s`;
    }

    const wholeMinutes = Math.round(roundedMinutes);
    return `${wholeMinutes}min`;
  }

  formatTimerDisplay(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
  }
}