// src/app/core/models/ui.model.ts
export interface LoadingState {
  isLoading: boolean;
  error?: string;
}

export interface NotificationMessage {
  id: string;
  type: 'success' | 'error' | 'warning' | 'info';
  title: string;
  message: string;
  duration?: number;
}
