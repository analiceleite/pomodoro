// Add module declaration for better-sqlite3 if types are missing
// @ts-ignore
import Database from 'better-sqlite3';
import path from 'path';
import os from 'os';

// Caminho persistente para o banco de dados usando diretório do usuário
const userDataPath = process.env.POMODORO_DATA_PATH || path.join(os.homedir(), '.pomodoro');
const dbPath = path.join(userDataPath, 'pomodoro.db');

// Criar diretório se não existir
import fs from 'fs';
if (!fs.existsSync(userDataPath)) {
  fs.mkdirSync(userDataPath, { recursive: true });
}

const db = new Database(dbPath);

// Criar banco de dados no diretório persistente
console.log(`Banco de dados armazenado em: ${dbPath}`);

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

// Limpar todos os ciclos do banco
export function clearAllCycles() {
  const stmt = db.prepare('DELETE FROM completed_cycles');
  const result = stmt.run();
  console.log(`🗑️ ${result.changes} ciclos removidos do banco de dados`);
  return result;
}

// Exportar todos os dados
export function exportAllCycles() {
  const stmt = db.prepare(`
    SELECT id, timestamp, DATE(timestamp) as date
    FROM completed_cycles
    ORDER BY timestamp DESC
  `);
  const rows = stmt.all();
  return {
    exportDate: new Date().toISOString(),
    totalCycles: rows.length,
    cycles: rows
  };
}