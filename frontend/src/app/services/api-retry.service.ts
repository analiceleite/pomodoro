import { Injectable } from '@angular/core';
import { HttpClient, HttpErrorResponse } from '@angular/common/http';
import { Observable, timer, throwError } from 'rxjs';
import { retryWhen, concatMap, take, delay } from 'rxjs/operators';

@Injectable({
  providedIn: 'root'
})
export class ApiRetryService {

  constructor(private http: HttpClient) {}

  // Retry HTTP requests with exponential backoff
  retryWithBackoff<T>(request: Observable<T>, maxRetries: number = 5, baseDelay: number = 1000): Observable<T> {
    return request.pipe(
      retryWhen(errors =>
        errors.pipe(
          concatMap((error: HttpErrorResponse, index: number) => {
            console.log(`🔄 Retry attempt ${index + 1}/${maxRetries} for API request`);
            
            if (index >= maxRetries - 1) {
              console.error('❌ Max retries reached, throwing error');
              return throwError(error);
            }
            
            // Exponential backoff: 1s, 2s, 4s, 8s, 16s
            const delayMs = baseDelay * Math.pow(2, index);
            console.log(`⏰ Waiting ${delayMs}ms before retry...`);
            
            return timer(delayMs);
          })
        )
      )
    );
  }

  // Get with retry
  getWithRetry<T>(url: string, maxRetries?: number): Observable<T> {
    return this.retryWithBackoff(this.http.get<T>(url), maxRetries);
  }

  // Post with retry
  postWithRetry<T>(url: string, body: any, maxRetries?: number): Observable<T> {
    return this.retryWithBackoff(this.http.post<T>(url, body), maxRetries);
  }

  // Put with retry
  putWithRetry<T>(url: string, body: any, maxRetries?: number): Observable<T> {
    return this.retryWithBackoff(this.http.put<T>(url, body), maxRetries);
  }

  // Delete with retry
  deleteWithRetry<T>(url: string, maxRetries?: number): Observable<T> {
    return this.retryWithBackoff(this.http.delete<T>(url), maxRetries);
  }
}