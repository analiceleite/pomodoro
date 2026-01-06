// Add module declaration for better-sqlite3 if types are missing
// @ts-ignore
import Database from 'better-sqlite3';

const db = new Database('./pomodoro.db');

db.exec(`
  CREATE TABLE IF NOT EXISTS completed_cycles (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP
  );
`);

export function addCompletedCycle() {
  const stmt = db.prepare('INSERT INTO completed_cycles DEFAULT VALUES');
  stmt.run();
}

export function getDailyStats() {
  const stmt = db.prepare(`
    SELECT DATE(timestamp) as date, COUNT(*) as cycles
    FROM completed_cycles
    GROUP BY DATE(timestamp)
    ORDER BY date DESC
  `);
  const rows = stmt.all();
  return rows.map((row: any) => ({
    date: row.date,
    hours: (row.cycles * 25) / 60, // assuming 25 min per cycle
  }));
}