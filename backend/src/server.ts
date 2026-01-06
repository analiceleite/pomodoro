import express from 'express';
import cors from 'cors';
import 'dotenv/config';
import pomodoroRoutes from './routes/pomodoro.routes';
import './database/sqlite.js'; // init db

const app = express();

const PORT = process.env.PORT;

app.use(cors());
app.use(express.json());

app.use('/pomodoro', pomodoroRoutes);

app.listen(PORT, () => {
  console.log(`Pomodoro API running on port ${PORT}`);
});
