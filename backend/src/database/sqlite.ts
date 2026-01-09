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
    timestamp DATETIME DEFAULT CURRENT_TIMESTAMP,
    duration_minutes INTEGER DEFAULT 25
  );
`);

// Adicionar coluna duration_minutes se ela não existir (para bancos existentes)
try {
  const tableInfo = db.prepare("PRAGMA table_info(completed_cycles)").all();
  const hasDurationColumn = tableInfo.some((col: any) => col.name === 'duration_minutes');
  
  if (!hasDurationColumn) {
    console.log('🔄 Adicionando coluna duration_minutes à tabela existente...');
    db.exec(`ALTER TABLE completed_cycles ADD COLUMN duration_minutes INTEGER DEFAULT 25`);
    console.log('✅ Coluna duration_minutes adicionada com sucesso');
  }
} catch (error) {
  console.error('❌ Erro na migração da tabela:', error);
}

export function addCompletedCycle(durationMinutes: number = 25) {
  const stmt = db.prepare('INSERT INTO completed_cycles (duration_minutes) VALUES (?)');
  stmt.run(durationMinutes);
}

export function getDailyStats() {
  const stmt = db.prepare(`
    SELECT DATE(timestamp) as date, COUNT(*) as cycles, SUM(duration_minutes) as total_minutes
    FROM completed_cycles
    GROUP BY DATE(timestamp)
    ORDER BY date DESC
  `);
  const rows = stmt.all();
  return rows.map((row: any) => ({
    date: row.date,
    cycles: row.cycles,
    totalMinutes: row.total_minutes,
    hours: row.total_minutes / 60
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
    SELECT id, timestamp, duration_minutes, DATE(timestamp) as date
    FROM completed_cycles
    ORDER BY timestamp DESC
  `);
  const rows = stmt.all();
  const totalMinutes = rows.reduce((sum: number, row: any) => sum + row.duration_minutes, 0);
  return {
    exportDate: new Date().toISOString(),
    totalCycles: rows.length,
    totalMinutes: totalMinutes,
    cycles: rows
  };
}