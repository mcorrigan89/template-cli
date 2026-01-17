import { createFileRoute } from '@tanstack/react-router';
import { useState, useEffect } from 'react';
import { orpc, createWebSocketConnection } from '@/lib/api-client';
import { getSharedEnv } from '@template/env/shared';

export const Route = createFileRoute('/subscriptions-demo')({
  component: SubscriptionsDemo,
});

function SubscriptionsDemo() {
  return (
    <div className="container mx-auto p-8">
      <h1 className="mb-8 text-3xl font-bold">Subscriptions Demo</h1>

      <div className="grid gap-8">
        <CounterSubscription />
        <ChatSubscription />
        <WebSocketDemo />
      </div>
    </div>
  );
}

// Example 1: Counter Subscription with ORPC
function CounterSubscription() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [messages, setMessages] = useState<Array<{ count: number; timestamp: string }>>([]);

  useEffect(() => {
    if (!isSubscribed) {
      return;
    }

    // Subscribe to the counter endpoint
    const subscription = orpc.subscriptions.counter.subscribe(
      { interval: 1000 },
      {
        onData: (data) => {
          console.log('Counter data:', data);
          setMessages((prev) => [...prev.slice(-9), data]);
        },
        onError: (error) => {
          console.error('Counter subscription error:', error);
        },
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [isSubscribed]);

  return (
    <div className="rounded-lg border p-6">
      <h2 className="mb-4 text-2xl font-semibold">Counter Subscription (ORPC)</h2>
      <p className="mb-4 text-gray-600">
        Subscribes to a real-time counter that increments every second using ORPC subscriptions.
      </p>

      <button
        onClick={() => setIsSubscribed(!isSubscribed)}
        className="mb-4 rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
      >
        {isSubscribed ? 'Unsubscribe' : 'Subscribe'}
      </button>

      <div className="space-y-2">
        {messages.map((msg, index) => (
          <div key={index} className="rounded bg-gray-100 p-2">
            <span className="font-mono">Count: {msg.count}</span>
            <span className="ml-4 text-sm text-gray-500">
              {new Date(msg.timestamp).toLocaleTimeString()}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}

// Example 2: Chat Subscription with ORPC
function ChatSubscription() {
  const [isSubscribed, setIsSubscribed] = useState(false);
  const [roomId, setRoomId] = useState('general');
  const [messages, setMessages] = useState<
    Array<{ id: string; userId: string; message: string; timestamp: string }>
  >([]);

  useEffect(() => {
    if (!isSubscribed) {
      return;
    }

    // Subscribe to the chat room
    const subscription = orpc.subscriptions.chat.subscribe(
      { roomId },
      {
        onData: (data) => {
          console.log('Chat message:', data);
          setMessages((prev) => [...prev.slice(-9), data]);
        },
        onError: (error) => {
          console.error('Chat subscription error:', error);
        },
      }
    );

    return () => {
      subscription.unsubscribe();
    };
  }, [isSubscribed, roomId]);

  return (
    <div className="rounded-lg border p-6">
      <h2 className="mb-4 text-2xl font-semibold">Chat Subscription (ORPC)</h2>
      <p className="mb-4 text-gray-600">
        Subscribes to a chat room to receive real-time messages using ORPC subscriptions.
      </p>

      <div className="mb-4 flex gap-2">
        <input
          type="text"
          value={roomId}
          onChange={(e) => setRoomId(e.target.value)}
          placeholder="Room ID"
          className="flex-1 rounded border px-3 py-2"
          disabled={isSubscribed}
        />
        <button
          onClick={() => setIsSubscribed(!isSubscribed)}
          className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600"
        >
          {isSubscribed ? 'Leave Room' : 'Join Room'}
        </button>
      </div>

      <div className="space-y-2">
        {messages.map((msg) => (
          <div key={msg.id} className="rounded bg-gray-100 p-3">
            <div className="flex items-center justify-between">
              <span className="font-semibold">{msg.userId}</span>
              <span className="text-sm text-gray-500">
                {new Date(msg.timestamp).toLocaleTimeString()}
              </span>
            </div>
            <p className="mt-1">{msg.message}</p>
          </div>
        ))}
      </div>
    </div>
  );
}

// Example 3: Raw WebSocket Connection
function WebSocketDemo() {
  const [isConnected, setIsConnected] = useState(false);
  const [messages, setMessages] = useState<Array<{ type: string; message?: string }>>([]);
  const [ws, setWs] = useState<WebSocket | null>(null);

  const connect = () => {
    const env = getSharedEnv();
    const wsUrl = env.SERVER_URL.replace('http', 'ws') + '/ws';
    const socket = createWebSocketConnection(wsUrl);

    if (!socket) {
      return;
    }

    socket.addEventListener('open', () => {
      setIsConnected(true);
      setMessages((prev) => [...prev, { type: 'system', message: 'Connected to WebSocket' }]);
    });

    socket.addEventListener('message', (event) => {
      try {
        const data = JSON.parse(event.data);
        setMessages((prev) => [...prev.slice(-9), data]);
      } catch {
        setMessages((prev) => [...prev.slice(-9), { type: 'raw', message: event.data }]);
      }
    });

    socket.addEventListener('close', () => {
      setIsConnected(false);
      setMessages((prev) => [
        ...prev,
        { type: 'system', message: 'Disconnected from WebSocket' },
      ]);
    });

    setWs(socket);
  };

  const disconnect = () => {
    ws?.close();
    setWs(null);
  };

  const sendMessage = () => {
    ws?.send('Hello from client! ' + new Date().toISOString());
  };

  return (
    <div className="rounded-lg border p-6">
      <h2 className="mb-4 text-2xl font-semibold">Raw WebSocket Connection</h2>
      <p className="mb-4 text-gray-600">
        Direct WebSocket connection for custom real-time communication.
      </p>

      <div className="mb-4 flex gap-2">
        <button
          onClick={isConnected ? disconnect : connect}
          className={`rounded px-4 py-2 text-white ${
            isConnected ? 'bg-red-500 hover:bg-red-600' : 'bg-green-500 hover:bg-green-600'
          }`}
        >
          {isConnected ? 'Disconnect' : 'Connect'}
        </button>
        <button
          onClick={sendMessage}
          disabled={!isConnected}
          className="rounded bg-blue-500 px-4 py-2 text-white hover:bg-blue-600 disabled:bg-gray-300"
        >
          Send Message
        </button>
      </div>

      <div className="space-y-2">
        {messages.map((msg, index) => (
          <div key={index} className="rounded bg-gray-100 p-2">
            <span className="font-semibold">{msg.type}:</span>
            <span className="ml-2">{msg.message || JSON.stringify(msg)}</span>
          </div>
        ))}
      </div>
    </div>
  );
}
