import 'source-map-support/register';

import {
  Application,
  bodyParserMiddleware,
  errorMiddleware,
  jwtMiddleware,
  loggingMiddleware,
  queryMiddleware,
} from '@tenlastic/api-module';
import * as mongoose from 'mongoose';

const url = process.env.MONGO_CONNECTION_STRING;
mongoose.connect(url, { useFindAndModify: false, useNewUrlParser: true });

const app = new Application();
app.use(loggingMiddleware);
app.use(errorMiddleware);
app.use(bodyParserMiddleware);
app.use(queryMiddleware);
app.use(jwtMiddleware);

export { app };
