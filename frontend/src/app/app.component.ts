import { Component, inject, computed, effect } from '@angular/core';
import { RouterOutlet, RouterLink, RouterLinkActive, Router } from '@angular/router';
import { CommonModule } from '@angular/common';
import { AuthService } from './core/services/auth.service';
import { NotificationService } from './core/services/notification.service';
import { WebsocketService } from './core/services/websocket.service';
import { ToastComponent } from './shared/components/toast/toast.component';

@Component({
  selector: 'app-root',
  standalone: true,
  imports: [RouterOutlet, RouterLink, RouterLinkActive, CommonModule, ToastComponent],
  templateUrl: './app.component.html',
  styleUrl: './app.component.css'
})
export class AppComponent {
  title = 'Notification Centre';
  authService = inject(AuthService);
  notifService = inject(NotificationService);
  wsService = inject(WebsocketService);
  router = inject(Router);

  isLoggedIn = computed(() => !!this.authService.currentUser());
  isAdmin = computed(() => this.authService.isAdmin());
  username = computed(() => this.authService.currentUser()?.username || '');
  unreadCount = computed(() => this.notifService.unreadCount());

  constructor() {
    effect(() => {
      if (this.isLoggedIn()) {
        console.log('User logged in, initializing real-time link...');
        this.wsService.connect();
        this.notifService.loadInitialData();
      } else {
        this.wsService.disconnect();
      }
    });
  }

  logout() {
    this.authService.logout();
    this.router.navigate(['/login']);
  }
}
