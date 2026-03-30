import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { Router } from '@angular/router';
import { ToastService } from '../../../core/services/toast.service';

@Component({
  selector: 'app-toast',
  standalone: true,
  imports: [CommonModule],
  template: `
    <div class="toast-container">
      @for (t of toastService.toasts(); track t.id) {
        <div class="toast-entry animate-toast-in clickable" 
             [class]="t.type.toLowerCase()"
             (click)="goToDashboard($event, t.id)">
          <div class="toast-content">
            <div class="toast-icon">
              <svg *ngIf="t.type === 'INFO'" viewBox="0 0 24 24" class="icon"><circle cx="12" cy="12" r="10"/><line x1="12" y1="16" x2="12" y2="12"/><line x1="12" y1="8" x2="12.01" y2="8"/></svg>
              <svg *ngIf="t.type === 'WARNING'" viewBox="0 0 24 24" class="icon"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" y1="9" x2="12" y2="13"/><line x1="12" y1="17" x2="12.01" y2="17"/></svg>
              <svg *ngIf="t.type === 'ACTION_REQUIRED'" viewBox="0 0 24 24" class="icon"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
            </div>
            <div class="toast-message">
              <div class="toast-title">{{t.type === 'ACTION_REQUIRED' ? 'CRITICAL ALERT' : (t.type === 'WARNING' ? 'SYSTEM WARNING' : 'NOTIFICATION')}}</div>
              <div class="toast-text">{{t.message}}</div>
            </div>
          </div>
          <button class="toast-close" (click)="toastService.remove(t.id)">×</button>
        </div>
      }
    </div>
  `,
  styles: [`
    .toast-container {
      position: fixed;
      top: 1.5rem;
      left: 50%;
      transform: translateX(-50%);
      z-index: 200000;
      display: flex;
      flex-direction: column;
      align-items: center;
      gap: 0.75rem;
      pointer-events: none;
      width: 100%;
      padding: 0 1rem;
    }
    
    .toast-entry {
      pointer-events: auto !important;
      opacity: 1 !important;
      background: #1e293b; /* Solid background fallback */
      background: rgba(30, 41, 59, 0.98);
      backdrop-filter: blur(20px) saturate(200%);
      border: 1px solid rgba(255, 255, 255, 0.1);
      border-radius: 16px;
      padding: 1rem 1.25rem;
      display: flex;
      justify-content: space-between;
      align-items: center;
      gap: 1rem;
      box-shadow: 0 10px 30px rgba(0, 0, 0, 0.4), 
                  0 0 20px rgba(225, 29, 72, 0.1);
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1);
      cursor: pointer;
    }
    .toast-entry:hover { transform: scale(1.02); border-color: rgba(255, 255, 255, 0.2); background: rgba(30, 41, 59, 1); }
    
    .toast-entry.info { border-left: 4px solid #3b82f6; }
    .toast-entry.warning { border-left: 4px solid #f59e0b; }
    .toast-entry.action_required { border-left: 4px solid #e11d48; border-color: rgba(225, 29, 72, 0.3); }

    .toast-content { display: flex; align-items: center; gap: 1rem; }
    .toast-icon { width: 24px; height: 24px; flex-shrink: 0; }
    .icon { width: 24px; height: 24px; stroke: currentColor; fill: none; stroke-width: 2; }
    
    .info .toast-icon { color: #3b82f6; }
    .warning .toast-icon { color: #f59e0b; }
    .action_required .toast-icon { color: #e11d48; }

    .toast-message { display: flex; flex-direction: column; gap: 0.1rem; }
    .toast-title { font-size: 0.7rem; font-weight: 800; text-transform: uppercase; letter-spacing: 0.1em; opacity: 0.7; }
    .toast-text { font-size: 0.95rem; color: white; font-weight: 500; line-height: 1.4; }

    .toast-close {
      background: none;
      border: none;
      color: white;
      font-size: 1.5rem;
      line-height: 1;
      cursor: pointer;
      opacity: 0.4;
      transition: opacity 0.2s;
      padding: 0;
    }
    .toast-close:hover { opacity: 1; }

    @keyframes toastIn {
      from { transform: translateY(-40px) scale(0.9); opacity: 0; }
      to { transform: translateY(0) scale(1); opacity: 1; }
    }
    .animate-toast-in { animation: toastIn 0.4s cubic-bezier(0.16, 1, 0.3, 1) forwards; }
  `]
})
export class ToastComponent {
  toastService = inject(ToastService);
  private router = inject(Router);

  goToDashboard(event: Event, id: number) {
    event.stopPropagation();
    console.log('Toast clicked, navigating to Dashboard...');
    this.router.navigate(['/dashboard'], { queryParams: { refresh: Date.now() } });
    this.toastService.remove(id);
  }
}
