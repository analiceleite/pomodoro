export interface StopwatchState {
  elapsedSeconds: number;
  isRunning: boolean;
  isPaused: boolean;
}

export function createInitialState(): StopwatchState {
  return {
    elapsedSeconds: 0,
    isRunning: false,
    isPaused: false
  };
}
