import { Injectable, signal, inject } from '@angular/core';
import { HttpClient, HttpParams } from '@angular/common/http';
import { WebsocketService } from './websocket.service';
import { Observable, of, Subject, concat } from 'rxjs';
import { switchMap, tap, finalize, shareReplay } from 'rxjs/operators';
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
  totalPages = signal<number>(0);
  private myNotifCache = new Map<string, PageResponse<any>>();
  private historyCache = new Map<string, PageResponse<any>>();
  private usersCache = new Map<string, PageResponse<any>>();
  private inFlightRequests = new Map<string, Observable<PageResponse<any>>>();
  
  private newNotificationSubject = new Subject<any>();
  newNotification$ = this.newNotificationSubject.asObservable();
  private toastService = inject(ToastService);

  constructor(private http: HttpClient, private wsService: WebsocketService) {
    this.wsService.notifications$.subscribe((notification: any) => {
      if (!notification.id) {
        notification.id = -Date.now();
      }
      
      this.unreadCount.update(c => c + 1);
      this.myNotifCache.clear();
      this.preFetchMyNotifications(0, 10);
      this.historyCache.clear();
      this.newNotificationSubject.next(notification);
      
      this.persistUnreadCount();
      this.toastService.show(notification.message, notification.type);
    });

    // Cross-Tab State Sync: Listen for updates in other browser windows
    if (typeof window !== 'undefined') {
      window.addEventListener('storage', (event) => {
        if (event.key === 'unread_count_cache' && event.newValue) {
          const freshCount = parseInt(event.newValue, 10);
          if (!isNaN(freshCount)) this.unreadCount.set(freshCount);
        }
        if (event.key === 'dashboard_cache_p0' && event.newValue) {
          const freshData = JSON.parse(event.newValue);
          this.notifications.set(freshData);
        }
      });
    }
  }

  loadInitialData(page: number = 0, size: number = 10) {
    this.initializeFromLocalStorage();
    this.getMyNotifications(page, size).subscribe(data => {
      this.notifications.set(data.content);
      this.totalPages.set(data.totalPages);
      if (page === 0) this.persistDashboard(data);
    });
    this.refreshUnreadCount();
  }

  private initializeFromLocalStorage() {
    if (typeof window === 'undefined' || !window.localStorage) return;
    const dash = localStorage.getItem('dashboard_cache_p0');
    const unread = localStorage.getItem('unread_count_cache');
    if (dash) {
      this.notifications.set(JSON.parse(dash));
    }
    if (unread) {
      this.unreadCount.set(parseInt(unread, 10));
    }
  }

  private persistDashboard(data: PageResponse<any>) {
    if (typeof window === 'undefined' || !window.localStorage) return;
    localStorage.setItem('dashboard_cache_p0', JSON.stringify(data.content));
  }

  private persistUnreadCount() {
    if (typeof window === 'undefined' || !window.localStorage) return;
    localStorage.setItem('unread_count_cache', this.unreadCount().toString());
  }

  refreshUnreadCount() {
    this.http.get<number>(`${this.apiUrl}/unread-count`).subscribe(count => {
      this.unreadCount.set(count);
      this.persistUnreadCount();
    });
  }

  getMyNotifications(page: number = 0, size: number = 20, query?: string): Observable<PageResponse<any>> {
    let params = new HttpParams()
      .set('page', page.toString())
      .set('size', size.toString())
      .set('sort', 'createdAt,desc');

    if (query) params = params.set('q', query);

    const cacheKey = `${page}-${size}-${query || ''}`;

    // 1. Check Cache
    if (this.myNotifCache.has(cacheKey)) {
      return of(this.myNotifCache.get(cacheKey)!);
    }

    // 2. De-duplicate In-Flight Requests
    const requestKey = `my-${cacheKey}`;
    if (this.inFlightRequests.has(requestKey)) {
      return this.inFlightRequests.get(requestKey)!;
    }

    const obs = this.http.get<PageResponse<any>>(this.apiUrl, { params }).pipe(
      tap((data: PageResponse<any>) => {
        this.myNotifCache.set(cacheKey, data);
        if (page === 0 && !query) this.persistDashboard(data);
      }),
      finalize(() => this.inFlightRequests.delete(requestKey)),
      shareReplay(1)
    );

    this.inFlightRequests.set(requestKey, obs);
    return obs;
  }

  markAsRead(id: number, message?: string): Observable<number> {
    this.clearCache();
    
    return this.http.put<number>(`${this.apiUrl}/mark-read`, { id, message }).pipe(
      tap((newCount) => {
        // Update unread count authoritative from server
        this.unreadCount.set(newCount);
        this.persistUnreadCount();
        
        // Authoritative list update: mark as read only after server confirms
        this.notifications.update(arr => arr.map(n => 
          (n.id === id) || (message && n.message === message) ? { ...n, read: true } : n
        ));
        this.persistDashboard({ content: [...this.notifications()] } as any);
        console.log(`Marked notification ${id} as read. New unread count: ${newCount}`);
      })
    );
  }

  clearCache() {
    this.myNotifCache.clear();
    this.historyCache.clear();
    this.usersCache.clear();
  }

  forceRefresh() {
    this.clearCache();
    this.refreshUnreadCount();
    this.loadInitialData(0, 10);
  }

  markAllAsRead(): Observable<number> {
    this.clearCache();

    return this.http.put<number>(`${this.apiUrl}/read-all`, {}).pipe(
      tap((newCount) => {
        this.unreadCount.set(newCount);
        this.persistUnreadCount();
        this.forceRefresh();
        console.log('All notifications marked as read.');
      })
    );
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

  getAllSentNotifications(page: number = 0, size: number = 10, query?: string): Observable<PageResponse<any>> {
    const cacheKey = `history-${page}-${size}-${query || ''}`;
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

    const cacheKey = `history-${page}-${size}-${query || ''}`;
    if (this.inFlightRequests.has(cacheKey)) return this.inFlightRequests.get(cacheKey)!;

    const obs = this.http.get<PageResponse<any>>(`${this.adminUrl}/all`, { params }).pipe(
      finalize(() => this.inFlightRequests.delete(cacheKey)),
      shareReplay(1)
    );

    this.inFlightRequests.set(cacheKey, obs);
    return obs;
  }

  searchUsers(query: string, page = 0, size = 10) {
    const cacheKey = `users-search-${query}-${page}-${size}`;
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
      
    const cacheKey = `users-search-${query}-${page}-${size}`;
    if (this.inFlightRequests.has(cacheKey)) return this.inFlightRequests.get(cacheKey)!;

    const obs = this.http.get<PageResponse<any>>(`${this.getBaseUrl()}/api/admin/users/search`, { params }).pipe(
      finalize(() => this.inFlightRequests.delete(cacheKey)),
      shareReplay(1)
    );

    this.inFlightRequests.set(cacheKey, obs);
    return obs;
  }

  getUsers(page: number = 0, size: number = 10): Observable<PageResponse<any>> {
    const cacheKey = `users-all-${page}-${size}`;
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
      
    const cacheKey = `users-all-${page}-${size}`;
    if (this.inFlightRequests.has(cacheKey)) return this.inFlightRequests.get(cacheKey)!;

    const obs = this.http.get<PageResponse<any>>(`${this.getBaseUrl()}/api/admin/users`, { params }).pipe(
      finalize(() => this.inFlightRequests.delete(cacheKey)),
      shareReplay(1)
    );

    this.inFlightRequests.set(cacheKey, obs);
    return obs;
  }

  updateUser(id: number, user: any) {
    this.usersCache.clear();
    return this.http.put(`${this.getBaseUrl()}/api/admin/users/${id}`, user, { responseType: 'text' });
  }

  deleteUser(id: number) {
    this.usersCache.clear();
    return this.http.delete(`${this.getBaseUrl()}/api/admin/users/${id}`, { responseType: 'text' });
  }

  preFetchMyNotifications(page: number, size: number, query?: string, count: number = 1) {
    for (let i = 0; i < count; i++) {
        const targetPage = page + i;
        const cacheKey = `${targetPage}-${size}-${query || ''}`;
        if (this.myNotifCache.has(cacheKey)) continue;

        let params = new HttpParams()
          .set('page', targetPage.toString())
          .set('size', size.toString())
          .set('sort', 'createdAt,desc');
        
        if (query) params = params.set('q', query);
        
        this.http.get<PageResponse<any>>(this.apiUrl, { params }).subscribe(data => {
          this.myNotifCache.set(cacheKey, data);
        });
    }
  }

  preFetchHistory(page: number, size: number, query?: string, count: number = 1) {
    for (let i = 0; i < count; i++) {
        const targetPage = page + i;
        const cacheKey = `history-${targetPage}-${size}-${query || ''}`;
        if (this.historyCache.has(cacheKey)) continue;
        this.getAllSentNotificationsHttp(targetPage, size, query).subscribe(data => this.historyCache.set(cacheKey, data));
    }
  }

  preFetchUsers(page: number, size: number, query?: string, count: number = 1) {
    for (let i = 0; i < count; i++) {
        const targetPage = page + i;
        const cacheKey = query ? `users-search-${query}-${targetPage}-${size}` : `users-all-${targetPage}-${size}`;
        if (this.usersCache.has(cacheKey)) continue;
        
        const obs = query ? this.searchUsersHttp(query, targetPage, size) : this.getUsersHttp(targetPage, size);
        obs.subscribe(data => this.usersCache.set(cacheKey, data));
    }
  }
}
