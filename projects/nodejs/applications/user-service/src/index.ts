import 'source-map-support/register';

import { WebServer } from '@tenlastic/api-module';
import * as mongoose from 'mongoose';

import { router as passwordResetsRouter } from './handlers/password-resets';
import { router as usersRouter } from './handlers/users';

const url = process.env.MONGO_CONNECTION_STRING;
mongoose.connect(url, { useFindAndModify: false, useNewUrlParser: true });

const webServer = new WebServer();
webServer.use(passwordResetsRouter.routes());
webServer.use(usersRouter.routes());
webServer.serve();
webServer.start();

export { webServer };
