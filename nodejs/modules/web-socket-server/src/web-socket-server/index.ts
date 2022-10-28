import axios from 'axios';
import * as http from 'http';
import * as jsonwebtoken from 'jsonwebtoken';
import { Socket } from 'net';
import { URLSearchParams } from 'url';
import * as WS from 'ws';

export class WebSocket extends WS {
  public isAlive: boolean;
}
export interface AuthenticationData {
  apiKey?: string;
  jwt?: Jwt;
}
export interface Jwt {
  authorization?: { _id?: string; roles?: string[] };
  jti?: string;
  user?: { _id?: string; email?: string; username?: string };
}
export interface MessageData {
  _id: string;
  method: string;
  parameters: any;
}
export type ConnectionCallback = (auth: AuthenticationData, ws: WebSocket) => void | Promise<any>;
export type MessageCallback = (
  auth: AuthenticationData,
  data: MessageData,
  ws: WebSocket,
) => void | Promise<any>;
export type UpgradeCallback = (auth: AuthenticationData) => void | Promise<any>;
export type WebSocketCallback = 'connection' | 'message';

export class WebSocketServer {
  private connectionCallbacks: ConnectionCallback[] = [];
  private jwtPublicKey: string;
  private messageCallbacks: MessageCallback[] = [];
  private server: http.Server;
  private upgradeCallbacks: UpgradeCallback[] = [];
  private wss: WS.Server;

  constructor(server: http.Server) {
    this.jwtPublicKey = process.env.JWT_PUBLIC_KEY;

    this.server = server;
    this.server.on(
      'upgrade',
      async (request: http.IncomingMessage, socket: Socket, head: Buffer) => {
        try {
          const auth = await this.onUpgradeRequest(request);

          // Approve connection request and pass user data to connection event.
          this.wss.handleUpgrade(request, socket, head, (ws) => {
            this.wss.emit('connection', auth, ws);
          });
        } catch (e) {
          console.error(e);
          socket.destroy();
        }
      },
    );

    this.wss = new WS.Server({ noServer: true });
    this.wss.on('connection', async (auth: AuthenticationData, ws: WebSocket) => {
      ws.setMaxListeners(25);
      this.startHeartbeat(ws);

      const connectionPromises = this.connectionCallbacks.map((cc) => cc(auth, ws));
      await Promise.all(connectionPromises);

      ws.on('message', async (data) => {
        let json: MessageData;

        try {
          json = JSON.parse(data.toString());

          const messagePromises = this.messageCallbacks.map((mc) => mc(auth, json, ws));
          await Promise.all(messagePromises);
        } catch (e) {
          ws.send(JSON.stringify({ _id: json?._id, error: e.message }));
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

    const accessToken = urlSearchParams.get('access_token');
    const apiKey = urlSearchParams.get('api_key');
    if (!accessToken && !apiKey) {
      throw new Error('Missing required parameters: access_token or api_key.');
    }

    const auth: AuthenticationData = {};
    if (accessToken) {
      // If the public key is not specified via environment variables, fetch it from the API.
      if (!this.jwtPublicKey) {
        const response = await axios({ method: 'get', url: process.env.JWK_URL });
        const x5c = response.data.keys[0].x5c[0];
        this.jwtPublicKey = `-----BEGIN PUBLIC KEY-----\n${x5c}\n-----END PUBLIC KEY-----`;
      }

      // Verify it is a valid JWT.
      auth.jwt = jsonwebtoken.verify(accessToken, this.jwtPublicKey.replace(/\\n/g, '\n'), {
        algorithms: ['RS256'],
      }) as Jwt;
    } else {
      auth.apiKey = apiKey;
    }

    // If any upgrade callbacks throw an error, kill the connection.
    for (const upgrade of this.upgradeCallbacks) {
      await upgrade(auth);
    }

    return auth;
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
