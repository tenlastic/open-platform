import * as cors from '@koa/cors';
import { Server } from 'http';
import * as koa from 'koa';
import * as bodyParser from 'koa-bodyparser';
import * as mount from 'koa-mount';
import * as Router from 'koa-router';
import * as serve from 'koa-static';

import { apiKeyMiddleware, errorMiddleware, jwtMiddleware, queryMiddleware } from '../middleware';

export class WebServer {
  public app: koa;
  public server: Server;

  constructor(...middleware: koa.Middleware[]) {
    this.app = new koa();

    // Allow X-Forwarder-For headers.
    this.app.proxy = true;

    // Allow CORS requests.
    this.app.use(cors());

    // Set up body parser so we can access request body.
    this.app.use(bodyParser({ jsonLimit: '5mb' }));

    // Setup middleware.
    middleware.forEach((m) => this.app.use(m));
    this.app.use(errorMiddleware);
    this.app.use(queryMiddleware);
    this.app.use(jwtMiddleware);
    this.app.use(apiKeyMiddleware);
  }

  public serve(directory = 'public', path = '/', root = 'index.html') {
    // Redirect naked root URL to root document.
    const router = new Router();
    router.get(path, (ctx) => ctx.redirect(`${root}`));
    this.app.use(router.routes());

    // Serve static files from specified directory.
    this.app.use(mount(path, serve(directory)));
  }

  public start(port = 3000) {
    return new Promise<void>((resolve) => {
      this.server = this.app.listen(port, () => {
        console.log(`Koa server running on port ${port}.`);
        return resolve();
      });
    });
  }

  public use(middleware: koa.Middleware<any, koa.DefaultContext & koa.Context>) {
    this.app.use(middleware);
  }
}
