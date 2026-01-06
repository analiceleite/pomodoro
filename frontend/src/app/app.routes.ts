import { Routes } from '@angular/router';
import { Timer } from './pages/timer/timer';
import { Statistics } from './pages/statistics/statistics';

export const routes: Routes = [
    {
        path: '', component: Timer
    },
    {
        path: 'stats', component: Statistics
    }
];
