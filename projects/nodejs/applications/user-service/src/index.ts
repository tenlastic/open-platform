import 'source-map-support/register';

import * as cors from '@koa/cors';
import {
  errorMiddleware,
  jwtMiddleware,
  loggingMiddleware,
  queryMiddleware,
} from '@tenlastic/api-module';
import * as koa from 'koa';
import * as bodyParser from 'koa-bodyparser';
import * as mongoose from 'mongoose';

import { router } from './handlers';

const url = process.env.MONGO_CONNECTION_STRING;
mongoose.connect(url, { useFindAndModify: false, useNewUrlParser: true });

const app = new koa();

// Allow CORS requests.
app.use(cors());

// Set up body parser so we can access request body.
app.use(bodyParser({ jsonLimit: '5mb' }));

// Setup middleware.
app.use(loggingMiddleware);
app.use(errorMiddleware);
app.use(queryMiddleware);
app.use(jwtMiddleware);

// Add routes.
app.use(router.routes());

// Start the server.
const port = 3000;
const server = app.listen(port, () => {
  if (process.env.NODE_ENV !== 'test') {
    console.log(`Koa server running on port ${port}.`);
  }
});

export { app, server };
