import { Injectable } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable } from 'rxjs';

@Injectable({
  providedIn: 'root'
})
export class PomodoroService {
  private apiUrl = 'http://localhost:3000/pomodoro';

  constructor(private http: HttpClient) {}

  recordCycle(): Observable<any> {
    return this.http.post(`${this.apiUrl}/cycle`, {});
  }

  getStats(): Observable<any[]> {
    return this.http.get<any[]>(`${this.apiUrl}/stats`);
  }
}