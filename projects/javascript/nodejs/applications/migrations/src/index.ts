import 'source-map-support/register';

import '@tenlastic/logging';
import * as mongoose from '@tenlastic/mongoose-models';

(async () => {
  try {
    await mongoose.connect({
      connectionString: process.env.MONGO_CONNECTION_STRING,
      databaseName: 'api',
    });

    console.log('Syncing indexes...');
    await mongoose.syncIndexes();
    console.log('Indexes synced successfully!');

    process.exit();
  } catch {
    process.exit(1);
  }
})();
