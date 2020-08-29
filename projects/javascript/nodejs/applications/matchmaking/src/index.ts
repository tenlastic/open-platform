import 'source-map-support/register';

import '@tenlastic/logging';
import * as mongoose from '@tenlastic/mongoose-models';
import { QueueMember, QueueMemberDocument, QueueMemberModel } from '@tenlastic/mongoose-models';
import * as kafka from '@tenlastic/mongoose-change-stream-kafka';
import { WebServer } from '@tenlastic/web-server';
import * as Router from 'koa-router';

import { matchmake } from './matchmake';

// MongoDB & Kafka.
(async () => {
  await mongoose.connect({
    connectionString: process.env.MONGO_CONNECTION_STRING,
    databaseName: 'api',
  });
  await kafka.connect(process.env.KAFKA_CONNECTION_STRING.split(','));

  await kafka.rootWatch<QueueMemberDocument, QueueMemberModel>(
    QueueMember,
    'matchmaking',
    {},
    matchmake,
  );
})();

// Web Server.
const router = new Router();
router.get('/', ctx => (ctx.status = 200));
const webServer = new WebServer();
webServer.use(router.routes());
webServer.start();
