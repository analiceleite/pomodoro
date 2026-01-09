export interface TimerState {
  timeLeft: number;
  isRunning: boolean;
  currentPhase: 'work' | 'shortBreak' | 'longBreak';
  cycles: number;
  totalTimeForPhase: number;
  userStarted: boolean;
}

export function createInitialState(workDurationSeconds: number): TimerState {
  return {
    timeLeft: workDurationSeconds,
    isRunning: false,
    currentPhase: 'work',
    cycles: 0,
    totalTimeForPhase: workDurationSeconds,
    userStarted: false
  };
}