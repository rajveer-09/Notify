import { Component, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { FormsModule } from '@angular/forms';
import { Router } from '@angular/router';
import { AuthService } from '../../core/services/auth.service';

@Component({
  selector: 'app-login',
  standalone: true,
  imports: [CommonModule, FormsModule],
  template: `
    <div class="auth-wrapper animate-fade">
      <div class="auth-container glass-card">
        <div class="auth-header">
          <div class="logo-symbol-large">
            <svg viewBox="0 0 24 24" class="icon large-svg">
              <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
            </svg>
          </div>
          <h2 class="title">{{ isLogin ? 'System Access' : 'Node Enrollment' }}</h2>
          <p class="subtitle">{{ isLogin ? 'Authenticate to proceed' : 'Register a new entity in the network' }}</p>
        </div>

        <form (ngSubmit)="onSubmit()" class="auth-form">
          <div class="form-group animate-slide" *ngIf="!isLogin">
            <label>Public Alias</label>
            <div class="input-container">
              <svg viewBox="0 0 24 24" class="input-icon"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>
              <input type="text" [(ngModel)]="username" name="username" required placeholder="Select alias" class="premium-input with-icon">
            </div>
          </div>

          <div class="form-group animate-slide" *ngIf="!isLogin">
            <label>Organizational Unit</label>
            <div class="input-container">
              <svg viewBox="0 0 24 24" class="input-icon"><rect x="2" y="2" width="20" height="20" rx="2" ry="2"/><path d="M9 22V12h6v10M8 6h.01M16 6h.01M12 6h.01M12 10h.01M12 14h.01M16 10h.01M16 14h.01M8 10h.01M8 14h.01"/></svg>
              <select [(ngModel)]="department" name="department" required class="premium-input with-icon select-input">
                <option value="" disabled selected>Assign Unit</option>
                <option *ngFor="let dept of departments" [value]="dept">{{dept}}</option>
              </select>
            </div>
          </div>

          <div class="form-group animate-slide">
            <label>Digital Address</label>
            <div class="input-container">
              <svg viewBox="0 0 24 24" class="input-icon"><path d="M4 4h16c1.1 0 2 .9 2 2v12c0 1.1-.9 2-2 2H4c-1.1 0-2-.9-2-2V6c0-1.1.9-2 2-2z"/><polyline points="22,6 12,13 2,6"/></svg>
              <input type="email" [(ngModel)]="email" name="email" required placeholder="primary@network.io" class="premium-input with-icon">
            </div>
            <div class="error-text" *ngIf="email && !isValidEmail(email)">Invalid address format</div>
          </div>

          <div class="form-group animate-slide">
            <label>Security Key</label>
            <div class="input-container">
              <svg viewBox="0 0 24 24" class="input-icon"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>
              <input type="password" [(ngModel)]="password" name="password" required placeholder="••••••••" class="premium-input with-icon">
            </div>
          </div>

          <div class="status-box error" *ngIf="errorMsg">
            {{errorMsg}}
          </div>

          <button type="submit" class="btn btn-primary w-100" [disabled]="!email || !password || (!isLogin && (!username || !department)) || !isValidEmail(email)">
            {{ isLogin ? 'Authorize' : 'Initialize' }}
            <svg viewBox="0 0 24 24" class="icon arrow"><line x1="5" y1="12" x2="19" y2="12"></line><polyline points="12 5 19 12 12 19"></polyline></svg>
          </button>
        </form>

        <div class="auth-footer">
          <p>
            {{ isLogin ? "New to the network?" : "Already enrolled?" }}
            <button class="link-btn" (click)="toggleMode()">
              {{ isLogin ? 'Create Account' : 'Sign In' }}
            </button>
          </p>
        </div>
      </div>
    </div>
  `,
  styles: [`
    .auth-wrapper {
      display: flex;
      justify-content: center;
      align-items: center;
      min-height: 85vh;
      padding: 1rem;
    }
    .auth-container {
      width: 100%;
      max-width: 440px;
      padding: 3.5rem 3rem;
      position: relative;
    }
    .auth-header { text-align: center; margin-bottom: 3rem; }
    .logo-symbol-large { 
      width: 64px; 
      height: 64px; 
      margin: 0 auto 1.5rem auto; 
      background: linear-gradient(135deg, var(--primary-red), var(--primary-dark));
      border-radius: 18px;
      display: flex;
      align-items: center;
      justify-content: center;
      box-shadow: 0 10px 30px var(--primary-glow);
    }
    .large-svg { width: 36px; height: 36px; stroke: white; stroke-width: 1.5; }
    .title { font-size: 1.8rem; margin: 0 0 0.5rem 0; color: white; }
    .subtitle { color: var(--text-dim); font-size: 0.9rem; font-weight: 500; }
    
    .input-container { position: relative; display: flex; align-items: center; }
    .input-icon { 
      position: absolute; 
      left: 1rem; 
      width: 18px; 
      height: 18px; 
      stroke: var(--text-dim); 
      stroke-width: 2;
      fill: none;
      pointer-events: none;
    }
    .with-icon { padding-left: 3rem !important; }
    
    .select-input { -webkit-appearance: none; appearance: none; cursor: pointer; }
    .select-input option { background: var(--bg-surface); color: white; }
    
    .status-box { padding: 0.85rem 1rem; border-radius: 10px; margin-bottom: 1.5rem; font-size: 0.85rem; font-weight: 600; text-align: center; }
    .status-box.error { background: rgba(244, 63, 94, 0.1); color: var(--primary-red); border: 1px solid rgba(244, 63, 94, 0.2); }
    
    .btn-primary { width: 100%; margin-top: 1rem; justify-content: space-between; padding: 1rem 1.5rem; }
    .arrow { width: 20px; transition: transform 0.3s ease; }
    .btn-primary:hover .arrow { transform: translateX(5px); }
    
    .auth-footer { margin-top: 2.5rem; text-align: center; font-size: 0.9rem; color: var(--text-dim); }
    .link-btn { 
      background: none; 
      border: none; 
      color: var(--primary-red); 
      font-weight: 700; 
      cursor: pointer; 
      padding: 0; 
      margin-left: 0.5rem;
      transition: var(--transition-smooth);
    }
    .link-btn:hover { filter: brightness(1.2); text-decoration: underline; }

    @keyframes slideIn { from { opacity: 0; transform: translateY(10px); } to { opacity: 1; transform: translateY(0); } }
    .animate-slide { animation: slideIn 0.5s ease forwards; }
    .form-group:nth-child(1) { animation-delay: 0.1s; }
    .form-group:nth-child(2) { animation-delay: 0.2s; }
    .form-group:nth-child(3) { animation-delay: 0.3s; }
    .form-group:nth-child(4) { animation-delay: 0.4s; }
  `]
})
export class LoginComponent {
  isLogin = true;
  username = '';
  email = '';
  password = '';
  department = '';
  errorMsg = '';
  
  departments = ['Engineering', 'Marketing', 'Sales', 'HR', 'Operations', 'Finance', 'Legal'];

  authService = inject(AuthService);
  router = inject(Router);

  toggleMode() {
    this.isLogin = !this.isLogin;
    this.errorMsg = '';
  }

  isValidEmail(email: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }

  onSubmit() {
    this.errorMsg = '';
    
    if (!this.isValidEmail(this.email)) {
      this.errorMsg = 'Please enter a valid email address.';
      return;
    }

    if (this.isLogin) {
      this.authService.login({ email: this.email, password: this.password }).subscribe({
        next: () => this.router.navigate(['/dashboard']),
        error: () => this.errorMsg = 'Invalid email or password. Please try again.'
      });
    } else {
      if (!this.username || !this.department) {
        this.errorMsg = 'All fields are required for registration.';
        return;
      }
      this.authService.register({ 
        username: this.username, 
        email: this.email, 
        password: this.password, 
        role: 'ROLE_USER',
        department: this.department 
      }).subscribe({
        next: () => {
          this.isLogin = true;
          this.errorMsg = 'Registration successful! Please sign in.';
          this.password = '';
          this.department = '';
        },
        error: (err) => this.errorMsg = err.error || 'Registration failed'
      });
    }
  }
}
