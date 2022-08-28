import * as mongooseModels from '@tenlastic/mongoose-models';
import { WebServer } from '@tenlastic/web-server';

import { status } from './status';

(async () => {
  try {
    // MongoDB.
    await mongooseModels.connect({
      connectionString: process.env.MONGO_CONNECTION_STRING,
      databaseName: process.env.MONGO_DATABASE_NAME,
    });

    console.log('Syncing indexes...');
    await mongooseModels.syncIndexes();
    console.log('Indexes synced successfully.');

    // Background Tasks.
    await status();

    // Web Server.
    const webServer = new WebServer();
    webServer.use((ctx) => (ctx.status = 200));
    webServer.start();
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
})();
