import { Router } from 'express';
import { PomodoroController } from '../controllers/pomodoro.controller';

const router = Router();
const controller = new PomodoroController();

router.get('/', (req, res) => {
  res.send('Pomodoro API is working!');
});

router.post('/cycle', (req, res) => controller.recordCycle(req, res));
router.get('/stats', (req, res) => controller.getStats(req, res));
router.delete('/clear', (req, res) => controller.clearAllData(req, res));
router.get('/export', (req, res) => controller.exportData(req, res));

export default router;