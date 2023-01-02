import axios from 'axios';
import * as http from 'http';
import * as jsonwebtoken from 'jsonwebtoken';
import { Socket } from 'net';
import { URLSearchParams } from 'url';
import * as WS from 'ws';

import { Context, Jwt, Request, State, StatusCode, WebSocket } from '../definitions';
import { Middleware, MiddlewareLayer } from '../middleware';

export type ConnectionCallback = (state: State, ws: WebSocket) => void | Promise<any>;
export type UpgradeCallback = (state: State) => void | Promise<any>;
export type WebSocketCallback = 'connection' | 'message';

export class WebSocketServer {
  private connectionCallbacks: ConnectionCallback[] = [];
  private jwtPublicKey: string;
  private messageMiddleware = new Middleware();
  private server: http.Server;
  private upgradeCallbacks: UpgradeCallback[] = [];
  private wss: WS.Server;

  constructor(server: http.Server) {
    this.jwtPublicKey = process.env.JWT_PUBLIC_KEY;
    this.server = server;
    this.wss = new WS.Server({ noServer: true });
  }

  public connection(callback: ConnectionCallback) {
    this.connectionCallbacks.push(callback);
  }

  public listen() {
    this.server.on(
      'upgrade',
      async (request: http.IncomingMessage, socket: Socket, head: Buffer) => {
        try {
          const state = await this.onUpgradeRequest(request);

          // Approve connection request and pass user data to connection event.
          this.wss.handleUpgrade(request, socket, head, (ws) => {
            // Wrap send method to automatically stringify.
            const send = ws.send.bind(ws);
            ws.send = (data) => send(typeof data === 'string' ? data : JSON.stringify(data));

            this.wss.emit('connection', state, ws);
          });
        } catch (e) {
          console.error(e.message);
          socket.destroy();
        }
      },
    );

    this.wss.on('connection', async (state: State, ws: WebSocket) => {
      ws.setMaxListeners(25);
      this.startHeartbeat(ws);

      const connectionPromises = this.connectionCallbacks.map((cc) => cc(state, ws));
      await Promise.all(connectionPromises);

      ws.on('message', async (data) => {
        let json: Request;

        try {
          json = JSON.parse(data.toString());

          // Set the default status to 404 in case no middleware alter the response.
          const ctx = new Context({
            request: json,
            response: { _id: json._id, status: StatusCode.NotFound },
            state,
            ws,
          });

          // Run middleware.
          await this.messageMiddleware.run(ctx);

          // Default status to 200 if body is set.
          if (ctx.response.body && ctx.response.status === StatusCode.NotFound) {
            ctx.response.status = StatusCode.OK;
          }

          // Respond to the request.
          ws.send(ctx.response);
        } catch (e) {
          console.error(e.message);

          const errors = [{ message: e.message, name: e.name }];
          ws.send({ _id: json?._id, body: { errors }, status: StatusCode.BadRequest });
        }
      });
    });
  }

  public message(middleware: MiddlewareLayer | MiddlewareLayer[]) {
    this.messageMiddleware.use(middleware);
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

    const state: State = {};
    if (accessToken) {
      // If the public key is not specified via environment variables, fetch it from the API.
      if (!this.jwtPublicKey) {
        try {
          const response = await axios({ method: 'get', url: process.env.JWK_URL });
          const x5c = response.data.keys[0].x5c[0];
          this.jwtPublicKey = `-----BEGIN PUBLIC KEY-----\n${x5c}\n-----END PUBLIC KEY-----`;
        } catch {
          throw new Error('Could not fetch JWK from API.');
        }
      }

      // Verify it is a valid JWT.
      const jwt = jsonwebtoken.verify(accessToken, this.jwtPublicKey.replace(/\\n/g, '\n'), {
        algorithms: ['RS256'],
      }) as Jwt;

      state.authorization = jwt.authorization;
      state.jwt = jwt;
      state.user = jwt.user;
    } else {
      state.apiKey = apiKey;
    }

    // If any upgrade callbacks throw an error, kill the connection.
    for (const upgrade of this.upgradeCallbacks) {
      await upgrade(state);
    }

    return state;
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
