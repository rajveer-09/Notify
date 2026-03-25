import { Injectable } from '@angular/core';
import { Client, Message } from '@stomp/stompjs';
import SockJS from 'sockjs-client';
import { AuthService } from './auth.service';
import { Subject } from 'rxjs';

@Injectable({ providedIn: 'root' })
export class WebsocketService {
  private client!: Client;
  public notifications$ = new Subject<any>();

  constructor(private authService: AuthService) {}

  connect() {
    const token = this.authService.getToken();
    if (!token) return;

    this.client = new Client({
      // @ts-ignore
      webSocketFactory: () => new SockJS('http://localhost:8081/ws'),
      connectHeaders: {
        Authorization: `Bearer ${token}`
      },
      debug: (str) => console.log(str),
      reconnectDelay: 5000,
    });

    this.client.onConnect = () => {
      this.client.subscribe(`/user/queue/notifications`, (message: Message) => {
        if (message.body) {
          const notification = JSON.parse(message.body);
          this.notifications$.next(notification);
        }
      });
    };

    this.client.activate();
  }

  disconnect() {
    if (this.client) {
      this.client.deactivate();
    }
  }
}
