import {
  databaseService,
  namespaceService,
  setAccessToken,
  setApiUrl,
  WebSocket,
} from '@tenlastic/http';
import * as mongooseModels from '@tenlastic/mongoose-models';
import { WebServer } from '@tenlastic/web-server';
import * as mongoose from 'mongoose';

import { indexes } from './indexes';
import { status } from './status';
import { sync } from './sync';

const accessToken = process.env.ACCESS_TOKEN;
const apiUrl = process.env.API_URL;
const database = JSON.parse(process.env.DATABASE_JSON);
const mongoConnectionString = process.env.MONGO_CONNECTION_STRING;
const wssUrl = process.env.WSS_URL;

(async () => {
  setAccessToken(accessToken);
  setApiUrl(apiUrl);

  // MongoDB.
  try {
    await mongooseModels.connect({
      connectionString: mongoConnectionString,
      databaseName: 'database',
    });

    // Background Tasks.
    await indexes();
    await sync();
  } catch (e) {
    console.error(e.message);
  }

  // Background Tasks.
  await databaseService.findOne(database._id);
  await status();

  // Web Socket.
  const webSocket = new WebSocket();
  webSocket.emitter.on('open', () => {
    console.log('Web socket connected.');

    // Watch for updates to the Database.
    webSocket.subscribe(databaseService.emitter, {
      collection: 'databases',
      resumeToken: `database-${database._id}-sidecar`,
      where: { _id: database._id },
    });

    // Watch for updates to the Namespace.
    webSocket.subscribe(namespaceService.emitter, {
      collection: 'namespaces',
      resumeToken: `database-${database._id}-sidecar`,
      where: { _id: database.namespaceId },
    });
  });
  await webSocket.connect(wssUrl);

  // Web Server.
  const webServer = new WebServer();
  webServer.use((ctx) => (ctx.status = mongoose.connection.readyState === 1 ? 200 : 500));
  webServer.start();
})();
