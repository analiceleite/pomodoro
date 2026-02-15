import { Request, Response } from 'express';
import { PomodoroService } from '../services/pomodoro.service';

const pomodoroService = new PomodoroService();

export class PomodoroController {
  start(req: Request, res: Response) {
    res.status(201).json({ message: 'Pomodoro started' });
  }

  recordCycle(req: Request, res: Response) {
    try {
      console.log('📥 Recebendo requisição para registrar ciclo');
      const { durationMinutes, sessionType } = req.body;
      pomodoroService.recordCompletedCycle(durationMinutes, sessionType);
      console.log(`✅ Ciclo registrado no banco de dados com duração: ${durationMinutes || 25} minutos (tipo: ${sessionType || 'pomodoro'})`);
      res.status(201).json({ message: 'Cycle recorded successfully', timestamp: new Date().toISOString() });
    } catch (error) {
      console.error('❌ Erro ao registrar ciclo:', error);
      res.status(500).json({ error: 'Failed to record cycle' });
    }
  }

  getStats(req: Request, res: Response) {
    try {
      console.log('📊 Recebendo requisição para obter estatísticas');
      const stats = pomodoroService.getStatistics();
      console.log('📈 Estatísticas obtidas:', stats);
      res.json(stats);
    } catch (error) {
      console.error('❌ Erro ao obter estatísticas:', error);
      res.status(500).json({ error: 'Failed to get stats' });
    }
  }

  // Limpar todos os dados do banco
  clearAllData(req: Request, res: Response) {
    try {
      console.log('🗑️ Recebendo requisição para limpar todos os dados');
      pomodoroService.clearAllData();
      console.log('✅ Todos os dados foram limpos com sucesso');
      res.json({ message: 'All data cleared successfully' });
    } catch (error) {
      console.error('❌ Erro ao limpar dados:', error);
      res.status(500).json({ error: 'Failed to clear data' });
    }
  }

  // Exportar todos os dados
  exportData(req: Request, res: Response) {
    try {
      console.log('📤 Recebendo requisição para exportar dados');
      const data = pomodoroService.exportAllData();
      console.log('📊 Dados exportados com sucesso');
      res.json(data);
    } catch (error) {
      console.error('❌ Erro ao exportar dados:', error);
      res.status(500).json({ error: 'Failed to export data' });
    }
  }
}
