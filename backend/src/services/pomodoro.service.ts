import { addCompletedCycle, getDailyStats, clearAllCycles, exportAllCycles } from '../database/sqlite.js';

export class PomodoroService {
  recordCompletedCycle(durationMinutes?: number) {
    addCompletedCycle(durationMinutes);
  }

  getStatistics() {
    return getDailyStats();
  }

  clearAllData() {
    clearAllCycles();
  }

  exportAllData() {
    return exportAllCycles();
  }
}