import { Injectable, signal, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { WebsocketService } from './websocket.service';
import { Observable, of, Subject } from 'rxjs';
import { switchMap } from 'rxjs/operators';
import { ToastService } from './toast.service';

export interface PageResponse<T> {
  content: T[];
  totalElements: number;
  totalPages: number;
  size: number;
  number: number;
}

@Injectable({ providedIn: 'root' })
export class NotificationService {
  private getBaseUrl() {
    if (typeof window !== 'undefined') {
      const hostname = window.location.hostname;
      return `http://${hostname}:8081`;
    }
    return 'http://localhost:8081';
  }

  private apiUrl = `${this.getBaseUrl()}/api/notifications`;
  private adminUrl = `${this.getBaseUrl()}/api/admin/notifications`;

  notifications = signal<any[]>([]);
  unreadCount = signal<number>(0);
  private myNotifCache = new Map<number, PageResponse<any>>();
  private historyCache = new Map<string, PageResponse<any>>();
  private usersCache = new Map<string, PageResponse<any>>();
  
  private newNotificationSubject = new Subject<any>();
  newNotification$ = this.newNotificationSubject.asObservable();
  private toastService = inject(ToastService);

  constructor(private http: HttpClient, private wsService: WebsocketService) {
    this.wsService.notifications$.subscribe((notification: any) => {
      // Ensure specific global broadcast messages have a temporary ID for trackBy
      if (!notification.id) {
        notification.id = -Date.now(); // Use negative IDs for transient messages
      }
      this.unreadCount.update(c => c + 1);
      this.myNotifCache.clear(); // Invalidate cache on new message
      this.preFetchMyNotifications(0, 10); // Prime cache for page 0 instantly
      this.historyCache.clear(); // Invalidate history on new incoming broadcat
      this.newNotificationSubject.next(notification);
      
      // Show Premium Toast
      this.toastService.show(notification.message, notification.type);
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

    // Return from cache if available while refreshing in background
    if (this.myNotifCache.has(page)) {
      const cached = this.myNotifCache.get(page)!;
      // Refresh background anyway to ensure sync
      this.http.get<PageResponse<any>>(this.apiUrl, { params }).subscribe(data => this.myNotifCache.set(page, data));
      return of(cached);
    }

    return this.http.get<PageResponse<any>>(this.apiUrl, { params }).pipe(
      switchMap(data => {
        this.myNotifCache.set(page, data);
        return of(data);
      })
    );
  }

  markAsRead(id: number) {
    // Optimistic Update
    const previousNotifs = [...this.notifications()];
    const previousUnread = this.unreadCount();

    this.notifications.update(arr => arr.map(n => n.id === id ? { ...n, read: true } : n));
    this.unreadCount.update(c => Math.max(0, c - 1));
    this.myNotifCache.clear(); // Invalidate cache

    return this.http.put(`${this.apiUrl}/${id}/read`, {}, { responseType: 'text' }).subscribe({
      error: (err) => {
        console.error('Failed to mark notification as read, reverting...', err);
        this.notifications.set(previousNotifs);
        this.unreadCount.set(previousUnread);
      }
    });
  }

  markAllAsRead() {
    // Optimistic Update
    const previousNotifs = [...this.notifications()];
    const previousUnread = this.unreadCount();

    this.notifications.update(arr => arr.map(n => ({ ...n, read: true })));
    this.unreadCount.set(0);
    this.myNotifCache.clear(); // Invalidate cache

    return this.http.put(`${this.apiUrl}/read-all`, {}, { responseType: 'text' }).subscribe({
      error: (err) => {
        console.error('Failed to mark all as read, reverting...', err);
        this.notifications.set(previousNotifs);
        this.unreadCount.set(previousUnread);
      }
    });
  }

  broadcast(message: string, type: string) {
    this.historyCache.clear();
    return this.http.post(`${this.adminUrl}/broadcast`, { message, type }, { responseType: 'text' });
  }

  sendToDepartment(department: string, message: string, type: string) {
    this.historyCache.clear();
    return this.http.post(`${this.adminUrl}/department/${department}`, { message, type }, { responseType: 'text' });
  }

  sendToUser(email: string, message: string, type: string) {
    this.historyCache.clear();
    return this.http.post(`${this.adminUrl}/user/${email}`, { message, type }, { responseType: 'text' });
  }

  sendToDirectUsers(emails: string[], message: string, type: string) {
    this.historyCache.clear();
    return this.http.post(`${this.adminUrl}/direct`, { targetEmails: emails, message, type }, { responseType: 'text' });
  }

  getAllSentNotifications(page: number = 0, size: number = 20, query?: string): Observable<PageResponse<any>> {
    const cacheKey = `${page}-${size}-${query || ''}`;
    if (this.historyCache.has(cacheKey)) {
      const cached = this.historyCache.get(cacheKey)!;
      // Refresh background
      this.getAllSentNotificationsHttp(page, size, query).subscribe(data => this.historyCache.set(cacheKey, data));
      return of(cached);
    }

    return this.getAllSentNotificationsHttp(page, size, query).pipe(
      switchMap(data => {
        this.historyCache.set(cacheKey, data);
        return of(data);
      })
    );
  }

  private getAllSentNotificationsHttp(page: number, size: number, query?: string): Observable<PageResponse<any>> {
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
    const cacheKey = `search-${query}-${page}-${size}`;
    if (this.usersCache.has(cacheKey)) {
      const cached = this.usersCache.get(cacheKey)!;
      this.searchUsersHttp(query, page, size).subscribe(data => this.usersCache.set(cacheKey, data));
      return of(cached);
    }

    return this.searchUsersHttp(query, page, size).pipe(
      switchMap(data => {
        this.usersCache.set(cacheKey, data);
        return of(data);
      })
    );
  }

  private searchUsersHttp(query: string, page: number, size: number) {
    const params = new HttpParams()
      .set('q', query)
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<PageResponse<any>>(`http://localhost:8081/api/admin/users/search`, { params });
  }

  getUsers(page: number = 0, size: number = 10): Observable<PageResponse<any>> {
    const cacheKey = `all-${page}-${size}`;
    if (this.usersCache.has(cacheKey)) {
      const cached = this.usersCache.get(cacheKey)!;
      this.getUsersHttp(page, size).subscribe(data => this.usersCache.set(cacheKey, data));
      return of(cached);
    }

    return this.getUsersHttp(page, size).pipe(
      switchMap(data => {
        this.usersCache.set(cacheKey, data);
        return of(data);
      })
    );
  }

  private getUsersHttp(page: number, size: number): Observable<PageResponse<any>> {
    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString());
    return this.http.get<PageResponse<any>>(`${this.getBaseUrl()}/api/admin/users`, { params });
  }

  updateUser(id: number, user: any) {
    this.usersCache.clear();
    return this.http.put(`${this.getBaseUrl()}/api/admin/users/${id}`, user, { responseType: 'text' });
  }

  deleteUser(id: number) {
    this.usersCache.clear();
    return this.http.delete(`${this.getBaseUrl()}/api/admin/users/${id}`, { responseType: 'text' });
  }

  preFetchMyNotifications(page: number, size: number) {
    if (this.myNotifCache.has(page)) return;

    const params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', 'createdAt,desc');
    
    this.http.get<PageResponse<any>>(this.apiUrl, { params }).subscribe(data => {
      this.myNotifCache.set(page, data);
    });
  }

  preFetchHistory(page: number, size: number, query?: string) {
    const cacheKey = `${page}-${size}-${query || ''}`;
    if (this.historyCache.has(cacheKey)) return;
    this.getAllSentNotificationsHttp(page, size, query).subscribe(data => this.historyCache.set(cacheKey, data));
  }

  preFetchUsers(page: number, size: number, query?: string) {
    const cacheKey = query ? `search-${query}-${page}-${size}` : `all-${page}-${size}`;
    if (this.usersCache.has(cacheKey)) return;
    
    const obs = query ? this.searchUsersHttp(query, page, size) : this.getUsersHttp(page, size);
    obs.subscribe(data => this.usersCache.set(cacheKey, data));
  }
}
