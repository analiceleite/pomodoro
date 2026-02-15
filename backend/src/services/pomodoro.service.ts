import { addCompletedCycle, getDailyStats, clearAllCycles, exportAllCycles } from '../database/sqlite';

export class PomodoroService {
  recordCompletedCycle(durationMinutes?: number, sessionType?: string) {
    addCompletedCycle(durationMinutes, sessionType);
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