import * as http from 'http';
import * as jwt from 'jsonwebtoken';
import { Socket } from 'net';
import { posix } from 'path';
import { parse } from 'url';
import * as WS from 'ws';

export type WebSocketCallback = 'connection' | 'message';

export class WebSocket extends WS {
  public isAlive: boolean;
}
export interface Connection {
  callback: ConnectionCallback;
  path: string;
}
export interface Upgrade {
  callback: UpgradeCallback;
  path: string;
}
export type ConnectionCallback = (
  params: any,
  query: any,
  user: any,
  ws: WebSocket,
) => Promise<any>;
export type UpgradeCallback = (params: any, query: any, user: any) => Promise<any>;

export class WebSocketServer {
  private connections: Connection[] = [];
  private server: http.Server;
  private upgrades: Upgrade[] = [];
  private wss: WS.Server;

  constructor(server: http.Server) {
    this.server = server;
    this.server.on(
      'upgrade',
      async (request: http.IncomingMessage, socket: Socket, head: Buffer) => {
        await this.onUpgradeRequest(request, socket, head);
      },
    );

    this.wss = new WS.Server({ noServer: true });
    this.wss.on('connection', async (query: any, url: string, user: any, ws: WebSocket) => {
      this.startHeartbeat(ws);

      for (const connection of this.connections) {
        const isMatch = this.match(connection.path, url);
        if (!isMatch) {
          continue;
        }

        const params = this.params(connection.path, url);
        await connection.callback(params, query, user, ws);
      }
    });
  }

  public connection(path: string, callback: ConnectionCallback) {
    this.connections.push({ callback, path });
  }

  public upgrade(path: string, callback: UpgradeCallback) {
    this.upgrades.push({ callback, path });
  }

  /**
   * Returns true if the provided method and path match the incoming request.
   */
  private match(path: string, url: string) {
    const parsedUrl = parse(url);

    return this.pathToRegExp(path).test(parsedUrl.pathname);
  }

  private async onUpgradeRequest(request: http.IncomingMessage, socket: Socket, head: Buffer) {
    try {
      const url = request.url.split('?')[0];

      // Parse query string.
      const querystring = request.url.includes('?')
        ? request.url.substr(request.url.indexOf('?'))
        : request.url;
      const urlSearchParams = new URLSearchParams(querystring);
      const query = JSON.parse(urlSearchParams.get('query'));

      // Check to see if token is set.
      const token = query.token;
      if (!token) {
        socket.destroy();
        return;
      }

      // Verify it is a valid JWT.
      const result: any = jwt.verify(token, process.env.JWT_PUBLIC_KEY.replace(/\\n/g, '\n'), {
        algorithms: ['RS256'],
      });

      // If any upgrade callbacks throw an error, kill the connection.
      for (const upgrade of this.upgrades) {
        const isMatch = this.match(upgrade.path, url);
        if (!isMatch) {
          continue;
        }

        const params = this.params(upgrade.path, url);
        await upgrade.callback(params, query, result.user);
      }

      // Approve connection request and pass user data to connection event.
      this.wss.handleUpgrade(request, socket, head, ws => {
        this.wss.emit('connection', query, url, result.user, ws);
      });
    } catch (e) {
      socket.destroy();
      return;
    }
  }

  /**
   * Gets the named route parameters from the URL.
   */
  private params(path: string, url: string) {
    // Find variables within path.
    let variables = path.match(/:\w+/g);

    if (!variables) {
      return {};
    }

    const parsedUrl = parse(url);

    // Remove : from variable names.
    variables = variables.map(s => s.substring(1));

    // Map path variables into params object.
    const regex = this.pathToRegExp(path);
    const matches = regex.exec(parsedUrl.pathname);

    return variables.reduce((pre, cur, i) => {
      pre[cur] = matches[i + 1];
      return pre;
    }, {});
  }

  /**
   * Returns a RegExp for the path.
   */
  private pathToRegExp(path) {
    // Replace all variables with alphanumeric regular expression matching.
    path = path.replace(/:\w+/g, '([^\\/]+)');

    // Combine basePath with path.
    const wholePath = posix.join('/', path);

    return new RegExp('^' + wholePath + '$');
  }

  // Sends ping requests to connected clients.
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
