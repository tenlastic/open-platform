import 'source-map-support/register';
import '@tenlastic/logging';

import { mongo } from './mongo';

const mongoConnectionString = process.env.MONGO_CONNECTION_STRING;
const mongoDatabaseName = 'aggregation-api';

(async () => {
  try {
    await mongo(mongoConnectionString, mongoDatabaseName);

    process.exit();
  } catch (e) {
    console.error(e);
    process.exit(1);
  }
})();
