import { addCompletedCycle, getDailyStats } from '../database/sqlite.js';

export class PomodoroService {
  recordCompletedCycle() {
    addCompletedCycle();
  }

  getStatistics() {
    return getDailyStats();
  }
}