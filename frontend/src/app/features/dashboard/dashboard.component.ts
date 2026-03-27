import { Component, inject, OnInit, OnDestroy } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { NotificationService } from '../../core/services/notification.service';
import { Subscription } from 'rxjs';
import { ActivatedRoute } from '@angular/router';

@Component({
  selector: 'app-dashboard',
  standalone: true,
  imports: [CommonModule, DatePipe],
  template: `
    <div class="dashboard-wrapper animate-fade">
      <div class="dashboard-header">
        <div class="header-content">
          <h1 class="page-title">Operational Feed</h1>
          <p class="page-subtitle">Monitoring real-time network transmissions</p>
        </div>
        <button class="btn btn-secondary" *ngIf="notifService.unreadCount() > 0 && page === 0" (click)="markAllRead()">
          <svg viewBox="0 0 24 24" class="icon btn-icon"><polyline points="20 6 9 17 4 12"/></svg>
          Mark Synchronized
        </button>
      </div>
      
      <div class="feed-container">
        @if (notifService.notifications().length === 0) {
          <div class="empty-state glass-card">
            <div class="empty-visual">
              <svg viewBox="0 0 24 24" class="icon xlarge-svg">
                <path d="M22 12h-6l-2 3h-4l-2-3H2"/>
                <path d="M5.45 5.11L2 12v6a2 2 0 0 0 2 2h16a2 2 0 0 0 2-2v-6l-3.45-6.89A2 2 0 0 0 16.76 4H7.24a2 2 0 0 0-1.79 1.11z"/>
              </svg>
            </div>
            <h3>Buffer Empty</h3>
            <p>No active transmissions found in the current sector.</p>
          </div>
        }
        
        <div class="notif-list">
          @for (n of notifService.notifications(); track n.id) {
            <div class="notif-entry glass-card shadow-lg" 
                 [class.unread]="!n.read"
                 [class.marking-read]="markingReadIds.has(n.id)">
              <div class="entry-header">
                <div class="type-indicator" [ngClass]="n.type">
                  <svg *ngIf="n.type === 'INFO'" viewBox="0 0 24 24" class="icon mini-icon"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
                  <svg *ngIf="n.type === 'WARNING'" viewBox="0 0 24 24" class="icon mini-icon"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
                  <svg *ngIf="n.type === 'ACTION_REQUIRED'" viewBox="0 0 24 24" class="icon mini-icon"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
                  <span>{{n.type.replace('_', ' ')}}</span>
                </div>
                <span class="timestamp">{{n.createdAt | date:'HH:mm'}} • {{n.createdAt | date:'MMM d'}}</span>
              </div>
              
              <div class="entry-body">
                <p class="content">{{n.message}}</p>
              </div>
              
              <div class="entry-footer" *ngIf="!n.read">
                <button class="dismiss-btn" (click)="markRead(n.id)">
                  Acknowledge
                  <svg viewBox="0 0 24 24" class="icon tiny-icon"><polyline points="9 18 15 12 9 6"/></svg>
                </button>
              </div>
            </div>
          }
        </div>
        
        <div class="pagination-controls" *ngIf="totalPages > 1">
          <button (click)="changePage(page - 1)" [disabled]="page === 0" class="page-btn">
            <svg viewBox="0 0 24 24" class="icon tiny-icon"><polyline points="15 18 9 12 15 6"/></svg>
          </button>
          <span class="page-info">Matrix Segment {{page + 1}} / {{totalPages}}</span>
          <button (click)="changePage(page + 1)" [disabled]="page >= totalPages - 1" class="page-btn">
            <svg viewBox="0 0 24 24" class="icon tiny-icon"><polyline points="9 18 15 12 9 6"/></svg>
          </button>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .dashboard-wrapper { max-width: 1000px; margin: 0 auto; padding: 2rem 1rem; }
    
    .dashboard-header { 
      display: flex; 
      justify-content: space-between; 
      align-items: flex-start; 
      margin-bottom: 3.5rem;
    }
    
    .page-title { font-size: 2.2rem; margin: 0 0 0.4rem 0; color: white; }
    .page-subtitle { color: var(--text-dim); margin: 0; font-size: 1rem; font-weight: 500; }
    
    .btn-secondary { 
      background: rgba(255, 255, 255, 0.05); 
      border: 1px solid var(--glass-border); 
      color: white; 
      box-shadow: none;
      font-size: 0.85rem;
      padding: 0.6rem 1.25rem;
    }
    .btn-secondary:hover { background: rgba(255, 255, 255, 0.1); border-color: var(--glass-border-light); }
    .btn-icon { width: 16px; height: 16px; margin-right: 0.5rem; }

    .feed-container { position: relative; }
    .notif-list { display: grid; gap: 1.25rem; }
    
    .notif-entry { 
      padding: 1.5rem 2rem; 
      display: flex;
      flex-direction: column;
      gap: 1rem;
      border-left: 3px solid transparent;
    }
    
    .notif-entry.unread {
      border-left-color: var(--primary-red);
      background: rgba(244, 63, 94, 0.03);
    }

    .entry-header { display: flex; justify-content: space-between; align-items: center; }
    
    .type-indicator { 
      display: flex; 
      align-items: center; 
      gap: 0.6rem; 
      font-size: 0.7rem; 
      font-weight: 800; 
      text-transform: uppercase; 
      letter-spacing: 0.1em;
    }
    .mini-icon { width: 14px; height: 14px; }
    
    .INFO { color: #60a5fa; }
    .WARNING { color: #fbbf24; }
    .ACTION_REQUIRED { color: var(--primary-red); }

    .timestamp { font-size: 0.75rem; color: var(--text-dim); font-weight: 600; font-family: 'JetBrains Mono', monospace; }

    .content { font-size: 1.1rem; line-height: 1.6; color: var(--text-main); margin: 0; font-weight: 400; }

    .entry-footer { display: flex; justify-content: flex-end; padding-top: 0.5rem; border-top: 1px solid var(--glass-border); }
    .dismiss-btn { 
      background: none; 
      border: none; 
      color: var(--primary-red); 
      font-weight: 700; 
      font-size: 0.85rem; 
      cursor: pointer;
      display: flex;
      align-items: center;
      gap: 0.4rem;
      transition: var(--transition-smooth);
      padding: 0.5rem 0;
    }
    .dismiss-btn:hover { filter: brightness(1.2); letter-spacing: 0.02em; }
    .tiny-icon { width: 14px; height: 14px; }

    .empty-state { text-align: center; padding: 6rem 2rem; border-style: dashed; }
    .xlarge-svg { width: 80px; height: 80px; margin-bottom: 2rem; color: var(--text-dim); opacity: 0.4; }
    .empty-state h3 { font-size: 1.6rem; margin: 0; color: white; }
    .empty-state p { color: var(--text-dim); margin-top: 0.75rem; font-weight: 500; }

    .pagination-controls { 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      gap: 2rem; 
      margin-top: 3rem; 
      padding-top: 2rem;
      border-top: 1px solid var(--glass-border);
    }
    .page-info { color: white; font-weight: 700; font-size: 0.85rem; letter-spacing: 0.05em; text-transform: uppercase; opacity: 0.7; }
    .page-btn {
      width: 44px;
      height: 44px;
      border-radius: 12px;
      border: 1px solid var(--glass-border);
      background: rgba(255, 255, 255, 0.03);
      color: white;
      cursor: pointer;
      display: flex;
      align-items: center;
      justify-content: center;
      transition: all 0.3s ease;
    }
    .page-btn:hover:not(:disabled) { background: rgba(225, 29, 72, 0.1); border-color: var(--primary-red); color: var(--primary-red); }
    .page-btn:disabled { opacity: 0.3; cursor: not-allowed; }

    .notif-entry.marking-read {
      animation: acknowledgePulse 0.8s cubic-bezier(0.4, 0, 0.2, 1) forwards;
      pointer-events: none;
    }

    @keyframes acknowledgePulse {
      0% { transform: scale(1); opacity: 1; border-left-color: var(--primary-red); }
      30% { transform: scale(0.98); opacity: 0.8; background: rgba(244, 63, 94, 0.1); }
      100% { transform: scale(1); opacity: 0.7; border-left-color: transparent; }
    }
  `]
})
export class DashboardComponent implements OnInit, OnDestroy {
  notifService = inject(NotificationService);
  page = 0;
  totalPages = 0;
  markingReadIds = new Set<number>();
  private newNotifSub?: Subscription;
  private routeSub?: Subscription;
  private route = inject(ActivatedRoute);

  ngOnInit() {
    this.loadData();
    
    this.routeSub = this.route.queryParams.subscribe(params => {
      if (params['refresh']) {
        this.page = 0;
        this.loadData();
      }
    });

    this.newNotifSub = this.notifService.newNotification$.subscribe(notification => {
      if (this.page === 0) {
        this.notifService.notifications.update(n => [notification, ...n]);
      }
    });
  }

  ngOnDestroy() {
    this.newNotifSub?.unsubscribe();
    this.routeSub?.unsubscribe();
  }

  loadData() {
    this.notifService.getMyNotifications(this.page, 10).subscribe((data: any) => {
      this.totalPages = data.totalPages;
      this.notifService.notifications.set(data.content);
      
      // Pre-fetch next page if it exists
      if (this.page < this.totalPages - 1) {
        this.notifService.preFetchMyNotifications(this.page + 1, 10);
      }
    });
  }

  changePage(newPage: number) {
    this.page = newPage;
    this.loadData();
  }

  markRead(id: number) {
    this.markingReadIds.add(id);
    setTimeout(() => {
      this.notifService.markAsRead(id);
      setTimeout(() => this.markingReadIds.delete(id), 1000); // Allow animation to finish
    }, 300); // Small initial delay for animation feedback
  }

  markAllRead() {
    this.notifService.markAllAsRead();
  }
}
