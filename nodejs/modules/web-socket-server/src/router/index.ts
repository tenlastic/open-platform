import { posix } from 'path';

import { Request, StatusCode } from '../definitions';
import { Middleware, MiddlewareLayer } from '../middleware';

export class Router {
  private basePath: string;
  private middleware: MiddlewareLayer[];

  constructor(basePath?: string) {
    this.basePath = basePath;
    this.middleware = [];
  }

  /**
   * Registers middleware to a matching DELETE request.
   */
  public delete(path: string, ...middleware: MiddlewareLayer[]) {
    this.route('DELETE', path, ...middleware);
  }

  /**
   * Registers middleware to a matching GET request.
   */
  public get(path: string, ...middleware: MiddlewareLayer[]) {
    this.route('GET', path, ...middleware);
  }

  /**
   * Registers middleware to a matching POST request.
   */
  public post(path: string, ...middleware: MiddlewareLayer[]) {
    this.route('POST', path, ...middleware);
  }

  /**
   * Registers middleware to a matching PUT request.
   */
  public put(path: string, ...middleware: MiddlewareLayer[]) {
    this.route('PUT', path, ...middleware);
  }

  /**
   * Returns this router's middleware.
   */
  public routes() {
    return this.middleware;
  }

  /**
   * Registers middleware.
   */
  public use(middleware: MiddlewareLayer | MiddlewareLayer[]) {
    this.middleware = this.middleware.concat(middleware);
  }

  /**
   * Returns true if the provided method and path match the incoming request.
   */
  private match(method: string, path: string, request: Request) {
    if (request.method !== method) {
      return false;
    }

    return this.pathToRegExp(path).test(request.path);
  }

  /**
   * Gets the named route parameters from the URL.
   */
  private params(format: string, path: string) {
    // Find variables within path.
    const variables = format.match(/:\w+/g);
    if (!variables) {
      return {};
    }

    // Remove : from variable names.
    const params = variables.map((s) => s.substring(1));

    // Map path variables into params object.
    const regex = this.pathToRegExp(format);
    const matches = regex.exec(path);

    return params.reduce((pre, cur, i) => {
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
    const basePath = this.basePath ? this.basePath : '';
    const wholePath = posix.join('/', basePath, path);

    return new RegExp('^' + wholePath + '$');
  }

  /**
   * Registers middleware to a given method and path.
   */
  private route(method: string, path: string, ...middleware: MiddlewareLayer[]) {
    const routeMiddleware: MiddlewareLayer = async (ctx, next) => {
      if (this.match(method, path, ctx.request)) {
        console.log(`Method: ${method} - Path: ${path}`);

        // Route found, so default status to 200.
        ctx.response.status = StatusCode.OK;

        // Parse URL params.
        ctx.request.params = this.params(path, ctx.request.path);

        await new Middleware(middleware).run(ctx);
      } else if (next) {
        await next();
      }
    };

    this.middleware.push(routeMiddleware);
  }
}
