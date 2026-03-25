import { Injectable, signal } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { WebsocketService } from './websocket.service';
import { Observable } from 'rxjs';

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private apiUrl = 'http://localhost:8081/api/notifications';
  private adminUrl = 'http://localhost:8081/api/admin/notifications';

  notifications = signal<any[]>([]);
  unreadCount = signal<number>(0);

  constructor(private http: HttpClient, private wsService: WebsocketService) {
    this.wsService.notifications$.subscribe(notification => {
      this.notifications.update(n => [notification, ...n]);
      this.unreadCount.update(c => c + 1);
    });
  }

  loadInitialData(page: number = 0, size: number = 20) {
    this.getMyNotifications(page, size).subscribe(data => {
      this.notifications.set(data.content);
    });
    this.http.get<number>(`${this.apiUrl}/unread-count`).subscribe(count => {
      this.unreadCount.set(count);
    });
  }

  getMyNotifications(page: number = 0, size: number = 20): Observable<PageResponse<any>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', 'createdAt,desc');
    return this.http.get<PageResponse<any>>(this.apiUrl, { params });
  }

  markAsRead(id: number) {
    return this.http.put(`${this.apiUrl}/${id}/read`, {}, { responseType: 'text' }).subscribe(() => {
      this.notifications.update(arr => arr.map(n => n.id === id ? { ...n, read: true } : n));
      this.unreadCount.update(c => Math.max(0, c - 1));
    });
  }

  markAllAsRead() {
    return this.http.put(`${this.apiUrl}/read-all`, {}, { responseType: 'text' }).subscribe(() => {
      this.notifications.update(arr => arr.map(n => ({ ...n, read: true })));
      this.unreadCount.set(0);
    });
  }

  broadcast(message: string, type: string) {
    return this.http.post(`${this.adminUrl}/broadcast`, { message, type }, { responseType: 'text' });
  }

  sendToDepartment(department: string, message: string, type: string) {
    return this.http.post(`${this.adminUrl}/department/${department}`, { message, type }, { responseType: 'text' });
  }

  sendToUser(email: string, message: string, type: string) {
    return this.http.post(`${this.adminUrl}/user/${email}`, { message, type }, { responseType: 'text' });
  }

  sendToDirectUsers(emails: string[], message: string, type: string) {
    return this.http.post(`${this.adminUrl}/direct`, { targetEmails: emails, message, type }, { responseType: 'text' });
  }

  getAllSentNotifications(page: number = 0, size: number = 20, query?: string): Observable<PageResponse<any>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', 'createdAt,desc');
    
    if (query) {
      params = params.set('q', query);
    }
    
    return this.http.get<PageResponse<any>>(`${this.adminUrl}/all`, { params });
  }

  searchUsers(query: string, page = 0, size = 10) {
    const params = new HttpParams()
      .set('q', query)
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<PageResponse<any>>(`http://localhost:8081/api/admin/notifications/users/search`, { params });
  }

  getUsers(page: number = 0, size: number = 10): Observable<PageResponse<any>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<PageResponse<any>>(`http://localhost:8081/api/admin/notifications/users`, { params });
  }

  updateUser(id: number, user: any) {
    return this.http.put(`http://localhost:8081/api/admin/notifications/users/${id}`, user, { responseType: 'text' });
  }

  deleteUser(id: number) {
    return this.http.delete(`http://localhost:8081/api/admin/notifications/users/${id}`, { responseType: 'text' });
  }
}
