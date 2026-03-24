import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { Observable, tap } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class AuthService {
  private apiUrl = 'http://127.0.0.1:8081/api/auth';
  
  currentUser = signal<{username: string, role: string, department?: string} | null>(null);

  constructor(private http: HttpClient) {
    if (typeof window !== 'undefined' && window.localStorage) {
      const token = localStorage.getItem('token');
      const username = localStorage.getItem('username');
      const role = localStorage.getItem('role');
      const department = localStorage.getItem('department');
      if (token && username && role) {
        this.currentUser.set({ username, role, department: department || undefined });
      }
    }
  }

  login(credentials: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/login`, credentials).pipe(
      tap((res: any) => {
        if (typeof window !== 'undefined' && window.localStorage) {
          localStorage.setItem('token', res.token);
          localStorage.setItem('username', res.username);
          localStorage.setItem('role', res.role);
          if (res.department) localStorage.setItem('department', res.department);
        }
        this.currentUser.set({ username: res.username, role: res.role, department: res.department });
      })
    );
  }

  register(user: any): Observable<any> {
    return this.http.post(`${this.apiUrl}/register`, user, { responseType: 'text' });
  }

  logout() {
    if (typeof window !== 'undefined' && window.localStorage) {
      localStorage.clear();
    }
    this.currentUser.set(null);
  }

  getToken(): string | null {
    if (typeof window !== 'undefined' && window.localStorage) {
      return localStorage.getItem('token');
    }
    return null;
  }

  isAdmin(): boolean {
    return this.currentUser()?.role === 'ROLE_ADMIN';
  }
}
