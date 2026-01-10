import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import pomodoroRoutes from './routes/pomodoro.routes';
import './database/sqlite'; 

const app = express();

const PORT = Number(process.env.PORT) || 3000;

app.use(cors());
app.use(express.json());

app.use('/pomodoro', pomodoroRoutes);

app.listen(PORT, () => {
  console.log(`Pomodoro API running on http://localhost:${PORT}`);
});
