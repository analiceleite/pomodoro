import { Component, signal } from '@angular/core';
import { RouterOutlet } from '@angular/router';
import { Toolbar } from './components/toolbar/toolbar';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, Toolbar],
  templateUrl: './app.html'
})
export class App {
  protected readonly title = signal('frontend');
}
