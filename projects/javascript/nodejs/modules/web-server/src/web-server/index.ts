import * as cors from '@koa/cors';
import { Server } from 'http';
import * as koa from 'koa';
import * as bodyParser from 'koa-bodyparser';
import * as mount from 'koa-mount';
import * as Router from 'koa-router';
import * as serve from 'koa-static';

import {
  apiKeyMiddleware,
  errorMiddleware,
  jwtMiddleware,
  loggingMiddleware,
  queryMiddleware,
} from '../middleware';

export class WebServer {
  public app: koa;
  public server: Server;

  constructor() {
    this.app = new koa();

    // Allow X-Forwarder-For headers.
    this.app.proxy = true;

    // Allow CORS requests.
    this.app.use(cors());

    // Set up body parser so we can access request body.
    this.app.use(bodyParser({ jsonLimit: '5mb' }));

    // Setup middleware.
    this.app.use(loggingMiddleware);
    this.app.use(errorMiddleware);
    this.app.use(queryMiddleware);
    this.app.use(jwtMiddleware);
    this.app.use(apiKeyMiddleware);
  }

  public serve(directory = 'public', path = '/', root = 'index.html') {
    // Redirect naked root URL to root document.
    const router = new Router();
    router.get(path, ctx => ctx.redirect(`${root}`));
    this.app.use(router.routes());

    // Serve static files from specified directory.
    this.app.use(mount(path, serve(directory)));
  }

  public start(port = 3000) {
    this.server = this.app.listen(port, () => console.log(`Koa server running on port ${port}.`));
  }

  public use(middleware: koa.Middleware<koa.ParameterizedContext<any, {}>>) {
    this.app.use(middleware);
  }
}
