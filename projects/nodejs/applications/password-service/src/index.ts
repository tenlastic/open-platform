import 'source-map-support/register';

import { WebServer } from '@tenlastic/api-module';
import * as mongoose from 'mongoose';

import { router } from './handlers';

const url = process.env.MONGO_CONNECTION_STRING;
mongoose.connect(url, { useFindAndModify: false, useNewUrlParser: true });

const webServer = new WebServer();
webServer.use(router.routes());
webServer.serve();
webServer.start();

export { webServer };
