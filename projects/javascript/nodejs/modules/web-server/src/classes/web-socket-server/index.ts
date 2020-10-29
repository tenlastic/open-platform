import * as http from 'http';
import * as jsonwebtoken from 'jsonwebtoken';
import { Socket } from 'net';
import * as WS from 'ws';

export class WebSocket extends WS {
  public isAlive: boolean;
}
export interface MessageData {
  _id: string;
  method: string;
  parameters: any;
}
export interface SubscribeDataParameters {
  collection: string;
  collectionId: string;
  resumeToken: string;
  where: any;
}
export type ConnectionCallback = (jwt: any, ws: WebSocket) => void | Promise<any>;
export type MessageCallback = (data: MessageData, jwt: any, ws: WebSocket) => void | Promise<any>;
export type UpgradeCallback = (jwt: any) => void | Promise<any>;
export type WebSocketCallback = 'connection' | 'message';

export class WebSocketServer {
  private connectionCallbacks: ConnectionCallback[] = [];
  private messageCallbacks: MessageCallback[] = [];
  private server: http.Server;
  private upgradeCallbacks: UpgradeCallback[] = [];
  private wss: WS.Server;

  constructor(server: http.Server) {
    this.server = server;
    this.server.on(
      'upgrade',
      async (request: http.IncomingMessage, socket: Socket, head: Buffer) => {
        try {
          const jwt = await this.onUpgradeRequest(request);

          // Approve connection request and pass user data to connection event.
          this.wss.handleUpgrade(request, socket, head, ws => {
            this.wss.emit('connection', jwt, ws);
          });
        } catch (e) {
          console.error(e);
          socket.destroy();
        }
      },
    );

    this.wss = new WS.Server({ noServer: true });
    this.wss.on('connection', async (jwt: any, ws: WebSocket) => {
      this.startHeartbeat(ws);

      for (const connection of this.connectionCallbacks) {
        await connection(jwt, ws);
      }

      ws.on('message', async data => {
        const json = JSON.parse(data.toString());

        for (const message of this.messageCallbacks) {
          await message(json, jwt, ws);
        }
      });
    });
  }

  public connection(callback: ConnectionCallback) {
    this.connectionCallbacks.push(callback);
  }

  public message(callback: MessageCallback) {
    this.messageCallbacks.push(callback);
  }

  public upgrade(callback: UpgradeCallback) {
    this.upgradeCallbacks.push(callback);
  }

  private async onUpgradeRequest(request: http.IncomingMessage) {
    // Check to see if token is set.
    const urlSearchParams = new URLSearchParams(request.url.split('?')[1]);
    const token = urlSearchParams.get('access_token');
    if (!token) {
      throw new Error('Access token not found.');
    }

    // Verify it is a valid JWT.
    const jwt = jsonwebtoken.verify(token, process.env.JWT_PUBLIC_KEY.replace(/\\n/g, '\n'), {
      algorithms: ['RS256'],
    }) as any;

    // If any upgrade callbacks throw an error, kill the connection.
    for (const upgrade of this.upgradeCallbacks) {
      await upgrade(jwt);
    }

    return jwt;
  }

  // Sends ping requests to connected clients.
  private startHeartbeat(ws: WebSocket) {
    let timeout: NodeJS.Timeout;

    ws.on('pong', () => {
      clearTimeout(timeout);
    });

    // Send ping request every 5s seconds.
    const interval = setInterval(() => {
      ws.ping();

      // If a timeout has already been started, don't start another one.
      if (timeout) {
        return;
      }

      // If the socket has not responded before 15s, terminate the connection.
      timeout = setTimeout(() => {
        clearInterval(interval);
        ws.terminate();
      }, 15000);
    }, 5000);

    ws.on('close', () => {
      clearInterval(interval);
      clearTimeout(timeout);
    });
  }
}
