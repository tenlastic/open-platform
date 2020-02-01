import * as http from 'http';
import * as jwt from 'jsonwebtoken';
import { Socket } from 'net';
import * as WS from 'ws';

export type WebSocketCallback = 'connection' | 'message';

export class WebSocket extends WS {
  public isAlive: boolean;
}

export class WebSocketServer {
  private server: http.Server;
  private wss: WS.Server;

  constructor(
    server: http.Server,
    options: WS.ServerOptions = {},
    onConnection?: (ws: WebSocket, query: URLSearchParams, user: any) => void,
    onUpgradeRequest?: (query: URLSearchParams, user: any) => Promise<any>,
  ) {
    this.server = server;
    this.server.on('upgrade', (request: http.IncomingMessage, socket: Socket, head: Buffer) => {
      this.onUpgradeRequest(request, socket, head, onUpgradeRequest);
    });

    this.wss = new WS.Server({ noServer: true, ...options });
    this.wss.on('connection', (ws: WebSocket, query: any, user: any) => {
      if (onConnection) {
        onConnection(ws, query, user);
      }

      this.startHeartbeat(ws);
    });
  }

  private async onUpgradeRequest(
    request: http.IncomingMessage,
    socket: Socket,
    head: Buffer,
    guard: (query: URLSearchParams, user: any) => Promise<void>,
  ) {
    // Extract token from query string.
    const querystring = request.url.includes('?')
      ? request.url.substr(request.url.indexOf('?'))
      : request.url;
    const query = new URLSearchParams(querystring);

    const token = query.get('token');
    if (!token) {
      socket.destroy();
      return;
    }

    // Verify it is a valid JWT.
    let result: any;
    try {
      result = jwt.verify(token, process.env.JWT_SECRET);
    } catch (e) {
      socket.destroy();
      return;
    }

    if (guard) {
      try {
        await guard(query, result.user);
      } catch (e) {
        socket.destroy();
        return;
      }
    }

    // Approve connection request and pass user data to connection event.
    this.wss.handleUpgrade(request, socket, head, ws => {
      this.wss.emit('connection', ws, query, result.user);
    });
  }

  private startHeartbeat(ws: WebSocket) {
    let timeout: NodeJS.Timeout;

    ws.isAlive = true;
    ws.on('pong', () => {
      clearTimeout(timeout);
      ws.isAlive = true;
    });

    // Send ping request every 5s seconds.
    const interval = setInterval(() => {
      ws.isAlive = false;
      ws.ping();

      // If a timeout has already been started, don't start another one.
      if (timeout) {
        return;
      }

      // If the socket has not responded before 15s, terminate the connection.
      timeout = setTimeout(() => {
        if (!ws.isAlive) {
          clearInterval(interval);
          ws.terminate();

          return;
        }
      }, 15000);
    }, 5000);
  }
}
