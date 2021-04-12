import * as mongooseModels from '@tenlastic/mongoose-models';

import { indexes } from './indexes';
import { namespace } from './namespace';
import { status } from './status';

const mongoConnectionString = process.env.MONGO_CONNECTION_STRING;

(async () => {
  const mongoose = await mongooseModels.connect({
    connectionString: mongoConnectionString,
    databaseName: 'database',
  });
  mongoose.connection.on('error', e => {
    console.error(e);
    process.exit(1);
  });

  await indexes();
  await namespace();
  await status();
})();
