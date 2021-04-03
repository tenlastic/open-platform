import * as mongooseModels from '@tenlastic/mongoose-models';

import { indexes } from './indexes';
import { namespace } from './namespace';
import { status } from './status';

const mongoConnectionString = process.env.MONGO_CONNECTION_STRING;

(async () => {
  await mongooseModels.connect({
    connectionString: mongoConnectionString,
    databaseName: 'database',
  });

  await indexes();
  await namespace();
  await status();
})();
