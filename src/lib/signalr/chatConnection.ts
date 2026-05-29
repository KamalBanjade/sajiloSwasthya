import * as signalR from '@microsoft/signalr';
import Cookies from 'js-cookie';

// Shared singleton instance to prevent multiple connections
class ChatConnectionManager {
  private static instance: ChatConnectionManager;
  private connection: signalR.HubConnection | null = null;
  private isConnecting = false;

  private constructor() {}

  public static getInstance(): ChatConnectionManager {
    if (!ChatConnectionManager.instance) {
      ChatConnectionManager.instance = new ChatConnectionManager();
    }
    return ChatConnectionManager.instance;
  }

  public getConnection(): signalR.HubConnection | null {
    return this.connection;
  }

  public async connect(): Promise<signalR.HubConnection> {
    if (this.connection?.state === signalR.HubConnectionState.Connected) {
      return this.connection;
    }

    if (this.isConnecting) {
      // Return a promise that waits for the connection to establish
      return new Promise((resolve) => {
        const checkInterval = setInterval(() => {
          if (this.connection?.state === signalR.HubConnectionState.Connected) {
            clearInterval(checkInterval);
            resolve(this.connection);
          }
        }, 100);
      });
    }

    this.isConnecting = true;
    let token = Cookies.get('auth_token');
    if (!token && typeof window !== 'undefined') {
      try {
        const rawStorage = localStorage.getItem('auth-storage');
        if (rawStorage) {
          const parsed = JSON.parse(rawStorage);
          token = parsed.state?.token || parsed.state?.Token;
        }
      } catch (e) {
        console.error("Failed to parse auth token from localStorage", e);
      }
    }

    try {
      const isBrowser = typeof window !== 'undefined';
      const isLocalHost = isBrowser && (
        window.location.hostname === 'localhost' ||
        window.location.hostname === '127.0.0.1' ||
        window.location.hostname.startsWith('192.168.') ||
        window.location.hostname.startsWith('10.') ||
        window.location.hostname.startsWith('172.')
      );

      const socketBase = isLocalHost
        ? `http://${window.location.hostname}:5004`
        : (process.env.NEXT_PUBLIC_API_URL || 'http://localhost:5004/api').replace(/\/api$/, '');

      this.connection = new signalR.HubConnectionBuilder()
        .withUrl(`${socketBase}/hubs/chat`, {
          accessTokenFactory: () => token || '',
          withCredentials: true,
        })
        .withAutomaticReconnect({
          nextRetryDelayInMilliseconds: retryContext => {
            if (retryContext.previousRetryCount === 0) return 0;
            if (retryContext.previousRetryCount < 3) return 2000;
            return 5000; // Cap at 5 seconds
          }
        })
        .build();

      await this.connection.start();
      console.log('SignalR Chat Hub Connected.');
      this.isConnecting = false;
      return this.connection;
    } catch (err) {
      console.error('SignalR Chat Connection Error: ', err);
      this.isConnecting = false;
      throw err;
    }
  }

  public async disconnect() {
    if (this.connection) {
      await this.connection.stop();
      this.connection = null;
      console.log('SignalR Chat Hub Disconnected.');
    }
  }
}

export const chatConnectionManager = ChatConnectionManager.getInstance();
