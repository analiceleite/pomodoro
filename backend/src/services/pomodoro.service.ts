import { addCompletedCycle, getDailyStats, clearAllCycles, exportAllCycles } from '../database/sqlite';

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