import { Request, Response } from 'express';
import { PomodoroService } from '../services/pomodoro.service.js';

const pomodoroService = new PomodoroService();

export class PomodoroController {
  start(req: Request, res: Response) {
    res.status(201).json({ message: 'Pomodoro started' });
  }

  recordCycle(req: Request, res: Response) {
    try {
      pomodoroService.recordCompletedCycle();
      res.status(201).json({ message: 'Cycle recorded' });
    } catch (error) {
      res.status(500).json({ error: 'Failed to record cycle' });
    }
  }

  getStats(req: Request, res: Response) {
    try {
      const stats = pomodoroService.getStatistics();
      res.json(stats);
    } catch (error) {
      res.status(500).json({ error: 'Failed to get stats' });
    }
  }
}
