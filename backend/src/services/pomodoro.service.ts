import { addCompletedCycle, getDailyStats, clearAllCycles, exportAllCycles } from '../database/sqlite.js';

export class PomodoroService {
  recordCompletedCycle() {
    addCompletedCycle();
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