import { useEffect, useState } from 'react';
import { HubConnectionState } from '@microsoft/signalr';
import { chatConnectionManager } from '../lib/signalr/chatConnection';

export function useChatConnection() {
  const [isConnected, setIsConnected] = useState(false);
  const [error, setError] = useState<Error | null>(null);

  useEffect(() => {
    let mounted = true;

    const connect = async () => {
      try {
        const connection = await chatConnectionManager.connect();
        if (mounted) {
          setIsConnected(connection.state === HubConnectionState.Connected);
        }

        // Listen for reconnect events
        connection.onreconnecting(() => {
          if (mounted) setIsConnected(false);
        });

        connection.onreconnected(() => {
          if (mounted) setIsConnected(true);
        });

        connection.onclose((err) => {
          if (mounted) {
            setIsConnected(false);
            if (err) setError(err);
          }
        });
      } catch (err) {
        if (mounted) {
          setError(err instanceof Error ? err : new Error('Failed to connect to chat'));
          setIsConnected(false);
        }
      }
    };

    connect();

    // Do NOT disconnect on unmount by default because it's a singleton connection shared across components.
    // Disconnection should happen on logout.
    return () => {
      mounted = false;
    };
  }, []);

  return {
    connection: chatConnectionManager.getConnection(),
    isConnected,
    error
  };
}
