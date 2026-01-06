import { Router } from 'express';
import { PomodoroController } from '../controllers/pomodoro.controller.js';

const router = Router();
const controller = new PomodoroController();

router.get('/', (req, res) => {
  res.send('Pomodoro API is working!');
});

router.post('/cycle', (req, res) => controller.recordCycle(req, res));
router.get('/stats', (req, res) => controller.getStats(req, res));

export default router;