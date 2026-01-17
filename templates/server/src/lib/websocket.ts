import { WebSocketServer, WebSocket } from 'ws';
import { IncomingMessage } from 'node:http';
import type { ServerType } from '@hono/node-server';

export function setupWebSocketServer(httpServer: ServerType) {
  const wss = new WebSocketServer({
    server: httpServer as any,
    path: '/ws',
  });

  wss.on('connection', (ws: WebSocket, request: IncomingMessage) => {
    console.log('WebSocket client connected from:', request.socket.remoteAddress);

    ws.on('message', (message: Buffer) => {
      console.log('Received WebSocket message:', message.toString());

      // Echo back the message (you can customize this)
      ws.send(
        JSON.stringify({
          type: 'echo',
          data: message.toString(),
          timestamp: new Date().toISOString(),
        })
      );
    });

    ws.on('close', () => {
      console.log('WebSocket client disconnected');
    });

    ws.on('error', (error: Error) => {
      console.error('WebSocket error:', error);
    });

    // Send a welcome message
    ws.send(
      JSON.stringify({
        type: 'connected',
        message: 'WebSocket connection established',
        timestamp: new Date().toISOString(),
      })
    );
  });

  return wss;
}
