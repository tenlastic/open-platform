import { connect } from '@tenlastic/mongoose-models';
import { WebServer } from '@tenlastic/web-server';

import { migrations } from './migrations';
import { status } from './status';

const mongoConnectionString = process.env.MONGO_CONNECTION_STRING;
const mongoDatabaseName = process.env.MONGO_DATABASE_NAME;

(async () => {
  try {
    await connect({ connectionString: mongoConnectionString, databaseName: mongoDatabaseName });

    // Background Tasks.
    migrations();
    status();

    // Web Server.
    const webServer = new WebServer();
    webServer.use((ctx) => (ctx.status = 200));
    webServer.start();
  } catch (e) {
    console.error(e.message);
    process.exit(1);
  }
})();
