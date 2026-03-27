import { Injectable, signal } from '@angular/core';

export interface Toast {
  id: number;
  message: string;
  type: 'INFO' | 'WARNING' | 'ACTION_REQUIRED';
  visible: boolean;
}

@Injectable({ providedIn: 'root' })
export class ToastService {
  toasts = signal<Toast[]>([]);

  show(message: string, type: any = 'INFO') {
    console.log('Pushing Toast:', { message, type });
    const id = Date.now();
    const newToast: Toast = { id, message, type, visible: true };
    this.toasts.update(t => [...t, newToast]);

    // Auto-dismiss after 5 seconds
    setTimeout(() => this.remove(id), 5000);
  }

  remove(id: number) {
    this.toasts.update(t => t.filter(toast => toast.id !== id));
  }
}
