import { Injectable, signal } from '@angular/core';
import { HttpClient } from '@angular/common/http';
import { WebsocketService } from './websocket.service';

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private apiUrl = 'http://127.0.0.1:8081/api/notifications';
  private adminUrl = 'http://127.0.0.1:8081/api/admin/notifications';

  notifications = signal<any[]>([]);
  unreadCount = signal<number>(0);

  constructor(private http: HttpClient, private wsService: WebsocketService) {
    this.wsService.notifications$.subscribe(notification => {
      this.notifications.update(n => [notification, ...n]);
      this.unreadCount.update(c => c + 1);
    });
  }

  loadInitialData() {
    this.http.get<any[]>(this.apiUrl).subscribe(data => {
      this.notifications.set(data);
    });
    this.http.get<number>(`${this.apiUrl}/unread-count`).subscribe(count => {
      this.unreadCount.set(count);
    });
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

  sendToUser(username: string, message: string, type: string) {
    return this.http.post(`${this.adminUrl}/user/${username}`, { message, type }, { responseType: 'text' });
  }

  getAllSentNotifications() {
    return this.http.get<any[]>(`${this.adminUrl}/all`);
  }

  getUsers() {
    return this.http.get<any[]>(`http://127.0.0.1:8081/api/admin/notifications/users`);
  }

  updateUser(id: number, user: any) {
    return this.http.put(`http://127.0.0.1:8081/api/admin/notifications/users/${id}`, user, { responseType: 'text' });
  }

  deleteUser(id: number) {
    return this.http.delete(`http://127.0.0.1:8081/api/admin/notifications/users/${id}`, { responseType: 'text' });
  }
}
