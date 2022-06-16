import * as mongoose from 'mongoose';

import { Unique } from './model';

beforeEach(async function () {
  await Unique.syncIndexes({ background: true });
  await Unique.deleteMany({});
});
