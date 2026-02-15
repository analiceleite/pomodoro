import { Routes } from '@angular/router';
import { Timer } from './pages/timer/timer';
import { Stopwatch } from './pages/stopwatch/stopwatch';
import { Statistics } from './pages/statistics/statistics';

export const routes: Routes = [
    {
        path: '', component: Timer
    },
    {
        path: 'stopwatch', component: Stopwatch
    },
    {
        path: 'stats', component: Statistics
    }
];
