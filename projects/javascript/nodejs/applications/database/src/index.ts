import 'source-map-support/register';

import * as http from '@tenlastic/http';
import * as kafka from '@tenlastic/mongoose-change-stream-kafka';
import * as mongooseModels from '@tenlastic/mongoose-models';
import { WebServer } from '@tenlastic/web-server';

import { router as collectionsRouter } from './handlers/collections';
import { router as recordsRouter } from './handlers/records';

const accessToken = process.env.ACCESS_TOKEN;
const database = JSON.parse(process.env.DATABASE_JSON);
const kafkaConnectionString = process.env.KAFKA_CONNECTION_STRING;
const mongoConnectionString = process.env.MONGO_CONNECTION_STRING;
const wssUrl = process.env.WSS_URL;

(async () => {
  try {
    http.setAccessToken(accessToken);

    // Kafka.
    await kafka.connect(kafkaConnectionString);

    // MongoDB.
    await mongooseModels.connect({
      connectionString: mongoConnectionString,
      databaseName: 'api',
    });

    // Web Server.
    const webServer = new WebServer();
    webServer.use(collectionsRouter.routes());
    webServer.use(recordsRouter.routes());
    webServer.start();

    // Fetch Namespace.
    const response = await http.namespaceService.findOne(database.namespaceId);
    const namespace = new mongooseModels.Namespace(response as any);
    await namespace.save();

    // Update Namespace on NamespaceStore changes.
    http.namespaceStore.emitter.on('update', async n => {
      namespace.set(n);
      await namespace.save();
    });

    // Open WebSocket for Namespace.
    const webSocket = new http.WebSocket();
    webSocket.emitter.on('open', () => {
      webSocket.subscribe('namespaces', 'database', http.namespaceStore, { _id: namespace._id });
    });
    webSocket.connect(wssUrl);
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
