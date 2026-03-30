import { Component, inject, OnInit, OnDestroy, signal, untracked } from '@angular/core';
import { CommonModule, DatePipe } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Subject, of, Subscription } from 'rxjs';
import { debounceTime, distinctUntilChanged, switchMap, catchError } from 'rxjs/operators';
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
              
              <div class="form-group flex-1">
                <label>Priority level</label>
                <select [(ngModel)]="notificationType" name="type" class="premium-input">
                  <option value="INFO">Informational</option>
                  <option value="WARNING">Elevated</option>
                  <option value="ACTION_REQUIRED">Critical Path</option>
                </select>
              </div>

              <div class="form-group flex-1" [class.hidden-v]="mode === 'ALL'">
                <label *ngIf="mode === 'USER'">Recipients (Search by Email)</label>
                <label *ngIf="mode === 'DEPARTMENT'">Target Department</label>
                <label *ngIf="mode === 'ALL'">&nbsp;</label>

                <div class="search-tag-container premium-input" *ngIf="mode === 'USER'">
                  <div class="search-top-bar">
                    <svg viewBox="0 0 24 24" class="icon mini-icon search-icon-left"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                    <input type="text" [(ngModel)]="userSearch" name="search" placeholder="Type name or email..." (input)="filterUsers()" class="search-input">
                  </div>
                  
                  <div class="inline-results" *ngIf="userSearch && filteredUsers.length > 0">
                    <div *ngFor="let u of filteredUsers" (click)="addEmail(u.email)" class="search-item mini-item animate-fade">
                      <div class="item-info">
                        <span class="item-name">{{u.username}}</span>
                        <span class="item-email">{{u.email}}</span>
                      </div>
                      <svg viewBox="0 0 24 24" class="icon mini-icon add-icon"><line x1="12" y1="5" x2="12" y2="19"/><line x1="5" y1="12" x2="19" y2="12"/></svg>
                    </div>
                  </div>

                  <div class="selected-tags-area">
                    <div class="tags-placeholder" *ngIf="selectedEmails.length === 0 && !userSearch">Selected recipients will appear here...</div>
                    <span *ngFor="let email of selectedEmails" class="user-tag animate-fade">
                      {{email}}
                      <button (click)="removeEmail(email)" class="remove-tag">×</button>
                    </span>
                  </div>
                </div>

                <select [(ngModel)]="targetDepartment" name="targetDepartment" class="premium-input" *ngIf="mode === 'DEPARTMENT'">
                  <option value="" disabled selected>Select Department</option>
                  <option *ngFor="let d of departments" [value]="d">{{d}}</option>
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
            
            <button type="submit" class="btn btn-dispatch" [disabled]="!message || (mode === 'USER' && selectedEmails.length === 0) || (mode === 'DEPARTMENT' && !targetDepartment)">
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
          
          <div class="relative-container">
            <div *ngIf="loading()" class="admin-loader-container animate-fade">
              <div class="spinner-admin"></div>
              <p>Syncing archives...</p>
            </div>

            <!-- History Search Bar -->
            <div class="search-box-container animate-fade" [class.blurred]="loading()">
              <div class="premium-search-bar">
                <svg viewBox="0 0 24 24" class="icon mini-icon search-icon"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input type="text" [(ngModel)]="historySearch" placeholder="Search by message or recipient email..." (input)="filterHistory()" class="premium-search-input">
                <button *ngIf="historySearch" (click)="historySearch = ''; filterHistory()" class="clear-search">
                  <svg viewBox="0 0 24 24" class="icon mini-icon"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            </div>

            <div class="premium-table-wrapper" [class.blurred]="loading()">
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
                      <div class="user-detail">
                        <div class="username">{{n.recipient.username}}</div>
                        <div class="email">{{n.recipient.email}}</div>
                      </div>
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
          <div class="pagination-controls" *ngIf="historyTotalPages > 1">
            <button type="button" (click)="changeHistoryPage(historyPage - 1)" [disabled]="historyPage === 0" class="page-btn">
              <svg viewBox="0 0 24 24" class="icon tiny-icon"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <span class="page-info">Matrix Segment {{historyPage + 1}} / {{historyTotalPages}}</span>
            <button type="button" (click)="changeHistoryPage(historyPage + 1)" [disabled]="historyPage >= historyTotalPages - 1" class="page-btn">
              <svg viewBox="0 0 24 24" class="icon tiny-icon"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
          </div>
          </div>
        </div>

        <!-- Users Tab -->
        <div *ngIf="activeTab === 'users'" class="glass-card animate-fade users-tab">
          <div class="card-header">
            <h3>Entity Registry</h3>
            <p class="card-subtitle">Manage system users and access levels</p>
          </div>

          <div class="relative-container">
            <div *ngIf="loading()" class="admin-loader-container animate-fade">
              <div class="spinner-admin"></div>
              <p>Syncing entity records...</p>
            </div>

            <!-- User Search Bar -->
            <div class="search-box-container animate-fade" [class.blurred]="loading()">
              <div class="premium-search-bar">
                <svg viewBox="0 0 24 24" class="icon mini-icon search-icon"><circle cx="11" cy="11" r="8"/><line x1="21" y1="21" x2="16.65" y2="16.65"/></svg>
                <input type="text" [(ngModel)]="userListSearch" placeholder="Search by name or email..." (input)="filterUserList()" class="premium-search-input">
                <button *ngIf="userListSearch" (click)="userListSearch = ''; filterUserList()" class="clear-search">
                  <svg viewBox="0 0 24 24" class="icon mini-icon"><line x1="18" y1="6" x2="6" y2="18"/><line x1="6" y1="6" x2="18" y2="18"/></svg>
                </button>
              </div>
            </div>
            
            <div class="premium-table-wrapper" [class.blurred]="loading()">
            <table class="premium-table">
              <thead>
                <tr>
                  <th>Digital Address</th>
                  <th>User Alias</th>
                  <th>Department</th>
                  <th>Security Level</th>
                  <th>Commands</th>
                </tr>
              </thead>
              <tbody>
                <tr *ngFor="let u of users" class="animate-row">
                  <td>
                    <div class="editable-cell" [class.editing]="editingId === u.id">
                      <input *ngIf="editingId === u.id" [(ngModel)]="u.email" class="premium-input small">
                      <span *ngIf="editingId !== u.id">{{u.email}}</span>
                    </div>
                  </td>
                  <td>
                    <div class="editable-cell" [class.editing]="editingId === u.id">
                      <input *ngIf="editingId === u.id" [(ngModel)]="u.username" class="premium-input small">
                      <span *ngIf="editingId !== u.id">&#64;{{u.username}}</span>
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
          <div class="pagination-controls" *ngIf="usersTotalPages > 1">
            <button type="button" (click)="changeUsersPage(usersPage - 1)" [disabled]="usersPage === 0" class="page-btn">
              <svg viewBox="0 0 24 24" class="icon tiny-icon"><polyline points="15 18 9 12 15 6"/></svg>
            </button>
            <span class="page-info">Data Fragment {{usersPage + 1}} / {{usersTotalPages}}</span>
            <button type="button" (click)="changeUsersPage(usersPage + 1)" [disabled]="usersPage >= usersTotalPages - 1" class="page-btn">
              <svg viewBox="0 0 24 24" class="icon tiny-icon"><polyline points="9 18 15 12 9 6"/></svg>
            </button>
          </div>
          </div>
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
    
    .mode-selector { 
      display: flex; 
      gap: 0.5rem; 
      background: rgba(255, 255, 255, 0.03); 
      padding: 0.4rem; 
      border-radius: 12px; 
      margin: 0; 
      border: 1px solid var(--glass-border); 
      width: 100%; 
      height: 3.5rem;
      align-items: center;
    }
    .mode-selector button { flex: 1; height: 100%; padding: 0; border: none; background: transparent; color: var(--text-dim); border-radius: 8px; cursor: pointer; font-weight: 700; font-size: 0.75rem; transition: all 0.3s ease; text-transform: uppercase; letter-spacing: 0.05em; }
    .mode-selector button.active { background: var(--primary-red); color: white; box-shadow: 0 4px 15px rgba(225, 29, 72, 0.4); }
    .mode-selector button:hover:not(.active) { background: rgba(255, 255, 255, 0.05); color: white; }

    h3 { font-size: 2.2rem; margin: 0 0 0.25rem 0; color: white; font-weight: 800; letter-spacing: -0.03em; }
    .card-subtitle { color: var(--text-dim); font-size: 0.95rem; margin: 0; font-weight: 500; opacity: 0.8; }

    .form-row { display: flex; gap: 1.5rem; margin-bottom: 2rem; align-items: flex-start; }
    .flex-1 { flex: 1; min-width: 0; }
    .hidden-v { visibility: hidden; pointer-events: none; }
    
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
    .user-info { display: flex; align-items: center; gap: 0.75rem; color: white; }
    .user-detail { display: flex; flex-direction: column; gap: 0.1rem; }
    .username { font-weight: 700; font-size: 0.95rem; }
    .email { font-size: 0.75rem; color: var(--text-dim); font-weight: 500; font-family: 'JetBrains Mono', monospace; }
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
    .admin-main select.premium-input { height: 3.5rem; padding: 0 1rem; }
    .editable-cell input.premium-input { margin: -0.5rem 0; }
    .editable-cell.editing { min-width: 140px; }

    @keyframes rowIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .animate-row { animation: rowIn 0.5s ease-out forwards; }

    /* Search & Multi-Tag Styles (Unified Vertical Stack) */
    .search-tag-container { 
      display: flex; 
      flex-direction: column;
      padding: 0 !important; 
      height: 180px;
      overflow: hidden;
      border: 1px solid var(--glass-border-light);
      background: rgba(0, 0, 0, 0.2);
    }
    
    .search-top-bar { 
      display: flex; 
      align-items: center; 
      gap: 0.75rem; 
      padding: 0.75rem 1rem; 
      background: rgba(255, 255, 255, 0.03);
      border-bottom: 1px solid rgba(255, 255, 255, 0.05);
      flex-shrink: 0;
    }
    
    .search-icon-left { opacity: 0.4; width: 1.1rem; height: 1.1rem; }
    .search-input { background: transparent; border: none; color: white; flex: 1; font-size: 0.95rem; outline: none; }
    
    .inline-results { 
      max-height: 140px; 
      overflow-y: auto; 
      background: rgba(0, 0, 0, 0.3);
      border-bottom: 1px solid var(--primary-red-muted);
      flex-shrink: 0;
    }
    
    .selected-tags-area { 
      flex: 1; 
      overflow-y: auto; 
      padding: 1rem; 
      display: flex; 
      flex-wrap: wrap; 
      gap: 0.6rem; 
      align-content: flex-start;
      background: rgba(255, 255, 255, 0.01);
    }

    .tags-placeholder { color: var(--text-dim); font-size: 0.85rem; opacity: 0.5; font-style: italic; width: 100%; text-align: center; margin-top: 1rem; }
    .user-tag { background: rgba(225, 29, 72, 0.12); color: var(--primary-red); padding: 0.4rem 0.8rem; border-radius: 8px; font-size: 0.85rem; font-weight: 700; display: flex; align-items: center; gap: 0.5rem; border: 1px solid rgba(225, 29, 72, 0.2); }
    .remove-tag { background: none; border: none; color: var(--primary-red); cursor: pointer; font-size: 1.2rem; padding: 0; line-height: 1; opacity: 0.6; }
    
    .search-item.mini-item { display: flex; align-items: center; justify-content: space-between; padding: 0.6rem 1rem; cursor: pointer; border-bottom: 1px solid rgba(255, 255, 255, 0.02); }
    .search-item.mini-item:hover { background: rgba(225, 29, 72, 0.08); }
    .add-icon { width: 1rem; height: 1rem; color: var(--primary-red); opacity: 0.6; }
    
    .item-info { display: flex; flex-direction: column; }
    .page-info { color: white; font-weight: 700; font-size: 0.85rem; letter-spacing: 0.05em; text-transform: uppercase; opacity: 0.7; }
    
    .admin-loader-container {
      position: absolute;
      top: 0;
      left: 0;
      width: 100%;
      height: 100%;
      display: flex;
      flex-direction: column;
      align-items: center;
      justify-content: center;
      background: rgba(0, 0, 0, 0.4);
      backdrop-filter: blur(2px);
      z-index: 10;
      color: var(--primary-red);
      gap: 1rem;
      border-radius: 12px;
    }
    .spinner-admin {
      width: 40px;
      height: 40px;
      border: 3px solid rgba(225, 29, 72, 0.1);
      border-top-color: var(--primary-red);
      border-radius: 50%;
      animation: spin 0.8s linear infinite;
    }
    .blurred { 
      filter: blur(1.5px) grayscale(0.2);
      pointer-events: none;
      opacity: 0.7;
      transition: all 0.3s ease;
    }
    .relative-container { position: relative; }
    @keyframes spin { to { transform: rotate(360deg); } }

    .pagination-controls { 
      display: flex; 
      align-items: center; 
      justify-content: center; 
      gap: 2rem; 
      margin-top: 2rem; 
      padding-top: 1.5rem;
      border-top: 1px solid var(--glass-border);
    }
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

    /* New Search Styles */
    .search-box-container { padding: 0 1.5rem 1.5rem; }
    .premium-search-bar { 
      display: flex; 
      align-items: center; 
      gap: 1rem; 
      background: rgba(255, 255, 255, 0.03); 
      border: 1px solid var(--glass-border); 
      border-radius: 12px; 
      padding: 0.75rem 1.25rem;
      transition: all 0.3s ease;
    }
    .premium-search-bar:focus-within { background: rgba(255, 255, 255, 0.05); border-color: var(--primary-red-muted); box-shadow: 0 0 15px rgba(225, 29, 72, 0.1); }
    .premium-search-input { background: transparent; border: none; color: white; flex: 1; outline: none; font-size: 0.95rem; }
    .clear-search { background: none; border: none; color: var(--text-dim); cursor: pointer; opacity: 0.6; transition: opacity 0.2s; }
    .clear-search:hover { opacity: 1; color: var(--primary-red); }
  `]
})
export class AdminComponent {
  notifService = inject(NotificationService);
  loading = signal<boolean>(false);
  private currentLoaderTimer?: any;
  
  activeTab: 'send' | 'history' | 'users' = 'send';
  mode: 'ALL' | 'USER' | 'DEPARTMENT' = 'ALL';
  targetUsername = '';
  selectedEmails: string[] = [];
  userSearch = '';
  filteredUsers: any[] = [];
  targetDepartment = '';
  notificationType = 'INFO';
  message = '';
  successMsg = '';
  
  departments = ['Engineering', 'Marketing', 'Sales', 'HR', 'Operations', 'Finance', 'Legal'];

  history: any[] = [];
  historyPage = 0;
  historyTotalPages = 0;

  users: any[] = [];
  usersPage = 0;
  usersTotalPages = 0;
  userListSearch = '';
  
  allUsersForSearch: any[] = []; // Still used to store search results for UI
  editingId: number | null = null;
  private searchSubject = new Subject<string>();
  private historySearchSubject = new Subject<string>();
  private userListSearchSubject = new Subject<string>();
  private searchSubscription?: Subscription;
  private historySearchSubscription?: Subscription;
  private userListSearchSubscription?: Subscription;

  historySearch = '';

  ngOnInit() {
    this.loadData();
    // Proactive pre-fetch for the direct message search
    this.notifService.getUsers(0, 10).subscribe();
    
    // Optimized: Debounced server-side search instead of loading all users
    this.searchSubscription = this.searchSubject.pipe(
      debounceTime(100),
      distinctUntilChanged(),
      switchMap(query => {
        if (!query) return of({ content: [] });
        return this.notifService.searchUsers(query, 0, 10).pipe(
          catchError(() => of({ content: [] }))
        );
      })
    ).subscribe(data => {
      this.filteredUsers = data.content;
    });

    this.historySearchSubscription = this.historySearchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.historyPage = 0;
      this.loadData();
    });

    this.userListSearchSubscription = this.userListSearchSubject.pipe(
      debounceTime(300),
      distinctUntilChanged()
    ).subscribe(() => {
      this.usersPage = 0;
      this.loadData();
    });
  }

  ngOnDestroy() {
    this.searchSubscription?.unsubscribe();
    this.historySearchSubscription?.unsubscribe();
    this.userListSearchSubscription?.unsubscribe();
  }

  setTab(tab: 'send' | 'history' | 'users') {
    this.activeTab = tab;
    this.loadData();
  }
  loadData() {
    if (this.currentLoaderTimer) clearTimeout(this.currentLoaderTimer);
    
    this.currentLoaderTimer = setTimeout(() => this.loading.set(true), 80);

    if (this.activeTab === 'history') {
      this.notifService.getAllSentNotifications(this.historyPage, 10, this.historySearch).subscribe({
        next: (data) => {
          if (this.currentLoaderTimer) clearTimeout(this.currentLoaderTimer);
          this.history = data.content;
          this.historyTotalPages = data.totalPages;
          
          // Look-ahead: Pre-fetch next 3 pages
          if (this.historyPage < this.historyTotalPages - 1) {
            this.notifService.preFetchHistory(this.historyPage + 1, 10, this.historySearch, 3);
          }
          this.loading.set(false);
        },
        error: () => {
          if (this.currentLoaderTimer) clearTimeout(this.currentLoaderTimer);
          this.loading.set(false);
        }
      });
    } else if (this.activeTab === 'users') {
      const obs = this.userListSearch 
        ? this.notifService.searchUsers(this.userListSearch, this.usersPage, 10)
        : this.notifService.getUsers(this.usersPage, 10);
        
      obs.subscribe({
        next: (data) => {
          if (this.currentLoaderTimer) clearTimeout(this.currentLoaderTimer);
          this.users = data.content;
          this.usersTotalPages = data.totalPages;
          
          // Look-ahead: Pre-fetch next 3 pages
          if (this.usersPage < this.usersTotalPages - 1) {
            this.notifService.preFetchUsers(this.usersPage + 1, 10, this.userListSearch || undefined, 3);
          }
          this.loading.set(false);
        },
        error: () => {
          if (this.currentLoaderTimer) clearTimeout(this.currentLoaderTimer);
          this.loading.set(false);
        }
      });
    }
  }

  changeHistoryPage(page: number) {
    this.historyPage = page;
    this.loadData();
  }

  changeUsersPage(page: number) {
    this.usersPage = page;
    this.loadData();
  }

  filterUsers() {
    // Triggers the debounced search pipeline
    this.searchSubject.next(this.userSearch);
  }

  filterHistory() {
    this.historySearchSubject.next(this.historySearch);
  }

  filterUserList() {
    this.userListSearchSubject.next(this.userListSearch);
  }

  addEmail(email: string) {
    if (!this.selectedEmails.includes(email)) {
      this.selectedEmails.push(email);
    }
    this.userSearch = '';
    this.searchSubject.next('');
    this.filteredUsers = [];
  }

  removeEmail(email: string) {
    this.selectedEmails = this.selectedEmails.filter(e => e !== email);
  }

  sendNotification() {
    this.successMsg = 'Initiating Transmission...';
    
    let obs;
    if (this.mode === 'ALL') {
      obs = this.notifService.broadcast(this.message, this.notificationType);
    } else if (this.mode === 'DEPARTMENT') {
      obs = this.notifService.sendToDepartment(this.targetDepartment, this.message, this.notificationType);
    } else {
      obs = this.notifService.sendToDirectUsers(this.selectedEmails, this.message, this.notificationType);
    }

    obs.subscribe({
      next: () => {
        this.successMsg = 'Dispatched successfully!';
        this.message = '';
        this.selectedEmails = [];
        setTimeout(() => this.successMsg = '', 2000);
      },
      error: (err) => {
        this.successMsg = '';
        alert('Failed to send notification: ' + (err.error?.message || 'Server error'));
      }
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
