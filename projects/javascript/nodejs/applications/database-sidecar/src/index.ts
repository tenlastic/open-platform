import * as mongooseModels from '@tenlastic/mongoose-models';
import { WebServer } from '@tenlastic/web-server';

import { indexes } from './indexes';
import { namespace } from './namespace';
import { status } from './status';

const mongoConnectionString = process.env.MONGO_CONNECTION_STRING;

(async () => {
  // MongoDB.
  const mongoose = await mongooseModels.connect({
    connectionString: mongoConnectionString,
    databaseName: 'database',
  });
  mongoose.connection.on('error', e => {
    console.error(e);
    process.exit(1);
  });

  // Background Tasks.
  await indexes();
  await namespace();
  await status();

  // Web Server.
  const webServer = new WebServer();
  webServer.use(ctx => (ctx.status = 200));
  webServer.start();
})();
