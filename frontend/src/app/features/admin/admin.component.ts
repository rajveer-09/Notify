import { Component, inject } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { NotificationService } from '../../core/services/notification.service';

@Component({
  selector: 'app-admin',
  standalone: true,
  imports: [CommonModule, FormsModule, DatePipe],
  template: `
    <div class="admin-grid animate-fade">
      <aside class="admin-sidebar glass-card">
        <div class="sidebar-header">
          <svg viewBox="0 0 24 24" class="icon header-icon"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>
          <h2>Control Center</h2>
        </div>
        <nav class="sidebar-nav">
          <button [class.active]="activeTab === 'send'" (click)="setTab('send')">
            <svg viewBox="0 0 24 24" class="icon btn-icon"><line x1="22" y1="2" x2="11" y2="13"/><polygon points="22 2 15 22 11 13 2 9 22 2"/></svg>
            Dispatch
          </button>
          <button [class.active]="activeTab === 'history'" (click)="setTab('history')">
            <svg viewBox="0 0 24 24" class="icon btn-icon"><path d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
            History
          </button>
          <button [class.active]="activeTab === 'users'" (click)="setTab('users')">
            <svg viewBox="0 0 24 24" class="icon btn-icon"><path d="M17 21v-2a4 4 0 0 0-4-4H5a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M23 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>
            Users
          </button>
        </nav>
      </aside>

      <main class="admin-main">
        <!-- Send Tab -->
        <div *ngIf="activeTab === 'send'" class="glass-card animate-fade">
          <div class="card-header">
            <h3>New Transmission</h3>
            <p class="card-subtitle">Broadcast globally or target specific nodes</p>
          </div>
          <form (ngSubmit)="sendNotification()">
            <div class="form-row">
              <div class="form-group flex-1">
                <label>Target Mode</label>
                <div class="mode-selector">
                  <button type="button" [class.active]="mode === 'ALL'" (click)="mode = 'ALL'">Global</button>
                  <button type="button" [class.active]="mode === 'DEPARTMENT'" (click)="mode = 'DEPARTMENT'">Department</button>
                  <button type="button" [class.active]="mode === 'USER'" (click)="mode = 'USER'">Direct</button>
                </div>
              </div>
              
              <div class="form-group flex-1" *ngIf="mode === 'USER'">
                <label>Recipient ID</label>
                <input type="text" [(ngModel)]="targetUsername" name="targetUsername" placeholder="Username" class="premium-input">
              </div>

              <div class="form-group flex-1" *ngIf="mode === 'DEPARTMENT'">
                <label>Target Department</label>
                <select [(ngModel)]="targetDepartment" name="targetDepartment" class="premium-input">
                  <option value="" disabled selected>Select Department</option>
                  <option *ngFor="let d of departments" [value]="d">{{d}}</option>
                </select>
              </div>

              <div class="form-group flex-1">
                <label>Priority level</label>
                <select [(ngModel)]="notificationType" name="type" class="premium-input">
                  <option value="INFO">Informational</option>
                  <option value="WARNING">Elevated</option>
                  <option value="ACTION_REQUIRED">Critical Path</option>
                </select>
              </div>
            </div>

            <div class="form-group">
              <label>Message Content</label>
              <textarea [(ngModel)]="message" name="message" rows="5" required placeholder="Enter message payload..." class="premium-input"></textarea>
            </div>
            
            <div class="status-box success" *ngIf="successMsg">
               <svg viewBox="0 0 24 24" class="icon success-icon"><polyline points="20 6 9 17 4 12"/></svg>
               {{successMsg}}
            </div>
            
            <button type="submit" class="btn btn-dispatch" [disabled]="!message || (mode === 'USER' && !targetUsername) || (mode === 'DEPARTMENT' && !targetDepartment)">
              Initialize Transmission 
              <svg viewBox="0 0 24 24" class="icon btn-icon-right"><line x1="5" y1="12" x2="19" y2="12"/><polyline points="12 5 19 12 12 19"/></svg>
            </button>
          </form>
        </div>

        <!-- History Tab -->
        <div *ngIf="activeTab === 'history'" class="glass-card animate-fade history-tab">
          <div class="card-header">
            <h3>Archived Logs</h3>
            <p class="card-subtitle">View all previous system communications</p>
          </div>
          <div class="premium-table-wrapper">
            <table class="premium-table">
              <thead>
                <tr>
                  <th>Timestamp</th>
                  <th>Recipient</th>
                  <th>Priority</th>
                  <th>Payload</th>
                  <th>Status</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let n of history" class="animate-row">
                  <td class="time-cell">{{n.createdAt | date:'MMM d, HH:mm'}}</td>
                  <td class="user-cell">
                    <div class="user-info">
                      <svg viewBox="0 0 24 24" class="icon mini-icon"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
                      {{n.recipient.username}}
                    </div>
                  </td>
                  <td>
                    <span class="type-pill" [class]="n.type.toLowerCase()">{{n.type.replace('_', ' ')}}</span>
                  </td>
                  <td class="msg-cell">{{n.message}}</td>
                  <td>
                    <span class="status-indicator" [class.active]="n.read">
                      {{n.read ? 'Delivered' : 'Pending'}}
                    </span>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>

        <!-- Users Tab -->
        <div *ngIf="activeTab === 'users'" class="glass-card animate-fade users-tab">
          <div class="card-header">
            <h3>Entity Registry</h3>
            <p class="card-subtitle">Manage system users and access levels</p>
          </div>
          <div class="premium-table-wrapper">
            <table class="premium-table">
              <thead>
                <tr>
                  <th>User Alias</th>
                  <th>Digital Address</th>
                  <th>Department</th>
                  <th>Security Level</th>
                  <th>Commands</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let u of users" class="animate-row">
                  <td>
                    <div class="editable-cell" [class.editing]="editingId === u.id">
                      <input *ngIf="editingId === u.id" [(ngModel)]="u.username" class="premium-input small">
                      <span *ngIf="editingId !== u.id">&#64;{{u.username}}</span>
                    </div>
                  </td>
                  <td>
                    <div class="editable-cell" [class.editing]="editingId === u.id">
                      <input *ngIf="editingId === u.id" [(ngModel)]="u.email" class="premium-input small">
                      <span *ngIf="editingId !== u.id">{{u.email}}</span>
                    </div>
                  </td>
                  <td>
                    <div class="editable-cell" [class.editing]="editingId === u.id">
                      <select *ngIf="editingId === u.id" [(ngModel)]="u.department" class="premium-input small">
                        <option value="" disabled>No Dept</option>
                        <option *ngFor="let d of departments" [value]="d">{{d}}</option>
                      </select>
                      <span *ngIf="editingId !== u.id" class="role-pill">{{u.department || 'None'}}</span>
                    </div>
                  </td>
                  <td>
                    <div class="editable-cell" [class.editing]="editingId === u.id">
                      <select *ngIf="editingId === u.id" [(ngModel)]="u.role" class="premium-input small">
                        <option value="ROLE_USER">USER</option>
                        <option value="ROLE_ADMIN">ADMIN</option>
                      </select>
                      <span *ngIf="editingId !== u.id" class="role-pill" [class.admin]="u.role === 'ROLE_ADMIN'">{{u.role.replace('ROLE_', '')}}</span>
                    </div>
                  </td>
                  <td>
                    <div class="action-set">
                      <button *ngIf="editingId !== u.id" (click)="editingId = u.id" class="icon-btn edit-btn" title="Edit Entity">
                        <svg viewBox="0 0 24 24" class="icon tiny-icon"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>
                      </button>
                      <button *ngIf="editingId === u.id" (click)="saveUser(u)" class="icon-btn save-btn" title="Commit Changes">
                        <svg viewBox="0 0 24 24" class="icon tiny-icon"><polyline points="20 6 9 17 4 12"/></svg>
                      </button>
                      <button (click)="deleteUser(u.id)" class="icon-btn delete-btn" title="Purge Entity">
                        <svg viewBox="0 0 24 24" class="icon tiny-icon"><polyline points="3 6 5 6 21 6"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6m3 0V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>
                      </button>
                    </div>
                  </td>
                </tr>
              </tbody>
            </table>
          </div>
        </div>
      </main>
    </div>
  `,
  styles: [`
    .admin-grid { display: grid; grid-template-columns: 280px 1fr; gap: 2rem; min-height: 85vh; margin: 1rem 0; align-items: start; }
    .admin-sidebar { padding: 2rem 1.5rem; height: auto; position: sticky; top: 7rem; }
    .sidebar-header { display: flex; align-items: center; gap: 1rem; margin-bottom: 3rem; padding-left: 0.5rem; }
    .header-icon { width: 24px; height: 24px; color: var(--primary-red); filter: drop-shadow(0 0 8px rgba(225, 29, 72, 0.4)); }
    .sidebar-header h2 { font-size: 0.9rem; color: white; margin: 0; text-transform: uppercase; letter-spacing: 0.15em; font-weight: 800; opacity: 0.9; }
    
    .sidebar-nav { display: flex; flex-direction: column; gap: 0.75rem; }
    .sidebar-nav button { 
      padding: 1rem 1.25rem; 
      border: none; 
      background: rgba(255, 255, 255, 0.02); 
      border-radius: 14px; 
      text-align: left; 
      cursor: pointer; 
      color: var(--text-dim); 
      font-weight: 600; 
      font-size: 0.95rem;
      transition: all 0.4s cubic-bezier(0.4, 0, 0.2, 1);
      display: flex;
      align-items: center;
      gap: 1rem;
      border: 1px solid transparent;
    }
    .btn-icon { width: 18px; height: 18px; opacity: 0.7; }
    .sidebar-nav button:hover { background: rgba(255, 255, 255, 0.06); color: white; transform: translateX(8px); }
    .sidebar-nav button.active { 
      background: rgba(225, 29, 72, 0.08); 
      color: white; 
      border-color: rgba(225, 29, 72, 0.2);
    }
    .sidebar-nav button.active .btn-icon { opacity: 1; color: var(--primary-red); filter: drop-shadow(0 0 5px var(--primary-red)); }

    .admin-main { min-width: 0; padding-top: 1rem; }
    .admin-main > .glass-card { padding: 3rem; margin-bottom: 2rem; }
    .card-header { margin-bottom: 2.5rem; border-left: 4px solid var(--primary-red); padding-left: 1.5rem; }
    
    .mode-selector { display: flex; gap: 0.5rem; background: rgba(255, 255, 255, 0.03); padding: 0.4rem; border-radius: 12px; margin-bottom: 0.5rem; border: 1px solid var(--glass-border); width: fit-content; }
    .mode-selector button { padding: 0.6rem 1.2rem; border: none; background: transparent; color: var(--text-dim); border-radius: 8px; cursor: pointer; font-weight: 700; font-size: 0.8rem; transition: all 0.3s ease; text-transform: uppercase; letter-spacing: 0.05em; }
    .mode-selector button.active { background: var(--primary-red); color: white; box-shadow: 0 4px 15px rgba(225, 29, 72, 0.4); }
    .mode-selector button:hover:not(.active) { background: rgba(255, 255, 255, 0.05); color: white; }

    h3 { font-size: 2.2rem; margin: 0 0 0.25rem 0; color: white; font-weight: 800; letter-spacing: -0.03em; }
    .card-subtitle { color: var(--text-dim); font-size: 0.95rem; margin: 0; font-weight: 500; opacity: 0.8; }

    .form-row { display: flex; gap: 1.5rem; margin-bottom: 2rem; }
    .flex-1 { flex: 1; }
    
    .status-box { padding: 1.25rem 1.5rem; border-radius: 14px; margin-bottom: 2rem; font-weight: 600; display: flex; align-items: center; gap: 1rem; font-size: 0.95rem; }
    .status-box.success { background: rgba(16, 185, 129, 0.05); color: #34d399; border: 1px solid rgba(16, 185, 129, 0.2); }
    .success-icon { width: 20px; height: 20px; }
    
    .btn-dispatch { width: 100%; justify-content: space-between; padding: 1.4rem 2.5rem; font-size: 1.1rem; }
    .btn-icon-right { width: 20px; height: 20px; transition: transform 0.3s ease; }
    .btn-dispatch:hover .btn-icon-right { transform: translateX(6px); }

    .premium-table-wrapper { overflow-x: auto; margin-top: 1rem; border-radius: 20px; border: 1px solid var(--glass-border); background: rgba(255, 255, 255, 0.01); }
    .premium-table { width: 100%; border-collapse: collapse; text-align: left; }
    .premium-table th { padding: 1.5rem; background: rgba(255, 255, 255, 0.03); color: var(--text-dim); font-size: 0.75rem; text-transform: uppercase; letter-spacing: 0.2em; font-weight: 800; border-bottom: 1px solid var(--glass-border); }
    .premium-table td { padding: 1.5rem; border-bottom: 1px solid var(--glass-border); color: var(--text-main); font-size: 0.95rem; vertical-align: middle; }
    .premium-table tr:last-child td { border-bottom: none; }
    .premium-table tr:hover { background: rgba(255, 255, 255, 0.02); }

    .time-cell { font-family: 'JetBrains Mono', monospace; font-size: 0.85rem; color: var(--text-dim); font-weight: 600; }
    .user-info { display: flex; align-items: center; gap: 0.75rem; font-weight: 700; color: white; }
    .mini-icon { width: 18px; height: 18px; color: var(--primary-red); opacity: 0.8; }
    .msg-cell { line-height: 1.6; color: var(--text-main); max-width: 350px; font-weight: 450; }
    
    .type-pill { padding: 0.3rem 0.8rem; border-radius: 8px; font-size: 0.65rem; font-weight: 900; text-transform: uppercase; letter-spacing: 0.05em; }
    .type-pill.info { background: rgba(59, 130, 246, 0.08); color: #60a5fa; border: 1px solid rgba(59, 130, 246, 0.2); }
    .type-pill.warning { background: rgba(245, 158, 11, 0.08); color: #fbbf24; border: 1px solid rgba(245, 158, 11, 0.2); }
    .type-pill.action_required { background: rgba(225, 29, 72, 0.08); color: var(--primary-red); border: 1px solid rgba(225, 29, 72, 0.2); }
    
    .status-indicator { font-size: 0.85rem; font-weight: 700; color: var(--text-dim); padding-left: 1rem; position: relative; }
    .status-indicator::before { content: ''; position: absolute; left: 0; top: 50%; transform: translateY(-50%); width: 6px; height: 6px; border-radius: 50%; background: #475569; }
    .status-indicator.active { color: #10b981; }
    .status-indicator.active::before { background: #10b981; box-shadow: 0 0 8px #10b981; }

    .role-pill { background: rgba(255, 255, 255, 0.05); padding: 0.3rem 0.7rem; border-radius: 8px; font-size: 0.75rem; font-weight: 800; color: var(--text-dim); }
    .role-pill.admin { background: rgba(225, 29, 72, 0.1); color: var(--primary-red); }

    .action-set { display: flex; gap: 0.5rem; }
    .icon-btn { 
      width: 40px; height: 40px; border: 1px solid var(--glass-border); background: rgba(255, 255, 255, 0.02); 
      border-radius: 12px; cursor: pointer; display: flex; align-items: center; justify-content: center; 
      transition: all 0.3s cubic-bezier(0.4, 0, 0.2, 1); color: var(--text-dim);
    }
    .tiny-icon { width: 16px; height: 16px; }
    .icon-btn:hover { background: rgba(255, 255, 255, 0.08); transform: translateY(-2px); color: white; border-color: var(--glass-border-light); }
    .edit-btn:hover { color: #60a5fa; border-color: rgba(96, 165, 250, 0.3); }
    .save-btn:hover { color: #10b981; border-color: rgba(16, 185, 129, 0.3); }
    .delete-btn:hover { color: var(--primary-red); border-color: rgba(225, 29, 72, 0.3); }
    
    .premium-input.small { padding: 0.5rem 0.75rem; font-size: 0.85rem; width: 100%; min-width: 120px; }
    .editable-cell input.premium-input { margin: -0.5rem 0; }
    .editable-cell.editing { min-width: 140px; }

    @keyframes rowIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .animate-row { animation: rowIn 0.5s ease-out forwards; }
  `]
})
export class AdminComponent {
  notifService = inject(NotificationService);
  
  activeTab: 'send' | 'history' | 'users' = 'send';
  mode: 'ALL' | 'USER' | 'DEPARTMENT' = 'ALL';
  targetUsername = '';
  targetDepartment = '';
  notificationType = 'INFO';
  message = '';
  successMsg = '';
  
  departments = ['Engineering', 'Marketing', 'Sales', 'HR', 'Operations', 'Finance', 'Legal'];

  history: any[] = [];
  users: any[] = [];
  editingId: number | null = null;

  ngOnInit() {
    this.loadData();
  }

  setTab(tab: 'send' | 'history' | 'users') {
    this.activeTab = tab;
    this.loadData();
  }

  loadData() {
    if (this.activeTab === 'history') {
      this.notifService.getAllSentNotifications().subscribe(data => this.history = data);
    } else if (this.activeTab === 'users') {
      this.notifService.getUsers().subscribe(data => this.users = data);
    }
  }

  sendNotification() {
    let obs;
    if (this.mode === 'ALL') {
      obs = this.notifService.broadcast(this.message, this.notificationType);
    } else if (this.mode === 'DEPARTMENT') {
      obs = this.notifService.sendToDepartment(this.targetDepartment, this.message, this.notificationType);
    } else {
      obs = this.notifService.sendToUser(this.targetUsername, this.message, this.notificationType);
    }

    obs.subscribe({
      next: () => {
        this.successMsg = 'Dispatched successfully!';
        this.message = '';
        setTimeout(() => this.successMsg = '', 3000);
      },
      error: () => alert('Failed to send notification.')
    });
  }

  saveUser(user: any) {
    this.notifService.updateUser(user.id, user).subscribe(() => {
      this.editingId = null;
      this.loadData();
    });
  }

  deleteUser(id: number) {
    if (confirm('Are you sure you want to delete this user?')) {
      this.notifService.deleteUser(id).subscribe(() => this.loadData());
    }
  }
}
