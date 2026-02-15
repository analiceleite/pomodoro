import { Injectable } from '@angular/core';

@Injectable({ providedIn: 'root' })
export class StopwatchUiService {
  formatTime(seconds: number): string {
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    if (hours > 0) {
      // Formato: HH:MM:SS
      return `${hours.toString().padStart(2, '0')}:${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    } else {
      // Formato: MM:SS
      return `${minutes.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
    }
  }

  getStopwatchColor(): string {
    return '#FF6B35'; // Cor diferente do Pomodoro (laranja vibrante)
  }

  getStopwatchIcon(): string {
    return 'schedule'; // Ícone de cronômetro
  }

  getStopwatchTitle(): string {
    return 'Cronômetro';
  }

  // Converter segundos para formato legível (ex: "1h 30m 45s" ou "45s")
  formatDuration(seconds: number): string {
    if (seconds === 0) return '0s';
    
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;

    const parts = [];
    if (hours > 0) parts.push(`${hours}h`);
    if (minutes > 0) parts.push(`${minutes}m`);
    if (secs > 0) parts.push(`${secs}s`);

    return parts.join(' ');
  }
}
