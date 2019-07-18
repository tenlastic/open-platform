import * as cors from '@koa/cors';
import { Server } from 'http';
import * as koa from 'koa';
import * as bodyParser from 'koa-bodyparser';
import * as serve from 'koa-static';

import {
  errorMiddleware,
  jwtMiddleware,
  loggingMiddleware,
  queryMiddleware,
} from '../../middleware';

export class WebServer {
  public app: koa;
  public server: Server;

  constructor() {
    this.app = new koa();

    // Allow CORS requests.
    this.app.use(cors());

    // Set up body parser so we can access request body.
    this.app.use(bodyParser({ jsonLimit: '5mb' }));

    // Setup middleware.
    this.app.use(loggingMiddleware);
    this.app.use(errorMiddleware);
    this.app.use(queryMiddleware);
    this.app.use(jwtMiddleware);
  }

  public serve(directory = 'public') {
    this.app.use(serve(directory));
  }

  public start(port = 3000) {
    this.server = this.app.listen(port, () => {
      if (process.env.NODE_ENV !== 'test') {
        console.log(`Koa server running on port ${port}.`);
      }
    });
  }

  public use(middleware: koa.Middleware<koa.ParameterizedContext<any, {}>>) {
    this.app.use(middleware);
  }
}
