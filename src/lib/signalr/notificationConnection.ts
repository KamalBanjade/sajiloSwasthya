import * as signalR from '@microsoft/signalr';
import Cookies from 'js-cookie';

const TOKEN_KEY = 'auth_token';

class NotificationConnectionManager {
  private static instance: NotificationConnectionManager;
  private connection: signalR.HubConnection | null = null;
  private isConnecting = false;

  private constructor() {}

  public static getInstance(): NotificationConnectionManager {
    if (!NotificationConnectionManager.instance) {
      NotificationConnectionManager.instance = new NotificationConnectionManager();
    }
    return NotificationConnectionManager.instance;
  }

  public getConnection(): signalR.HubConnection | null {
    return this.connection;
  }

  public async connect(): Promise<signalR.HubConnection> {
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      return this.connection;
    }

    if (this.isConnecting) {
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (this.connection?.state === signalR.HubConnectionState.Connected) {
            clearInterval(checkInterval);
            resolve(this.connection!);
          }
        }, 100);
      });
    }

    this.isConnecting = true;
    const token = Cookies.get(TOKEN_KEY);

    try {
      const isBrowser = typeof window !== 'undefined';
      const socketBase = isBrowser
        ? `http://${window.location.hostname}:5004`
        : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5004/api').replace(/\/api$/, '');

      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(`${socketBase}/hubs/notifications`, {
          accessTokenFactory: () => token || '',
          withCredentials: true,
        })
        .withAutomaticReconnect()
        .build();

      await this.connection.start();
      console.log('SignalR Notification Hub Connected.');
      this.isConnecting = false;
      return this.connection;
    } catch (err) {
      console.error('SignalR Notification Connection Error: ', err);
      this.isConnecting = false;
      throw err;
    }
  }

  public async disconnect() {
    if (this.connection) {
      await this.connection.stop();
      this.connection = null;
      console.log('SignalR Notification Hub Disconnected.');
    }
  }
}

export const notificationConnectionManager = NotificationConnectionManager.getInstance();
