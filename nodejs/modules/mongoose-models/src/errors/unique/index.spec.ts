import { Unique } from './model';

beforeEach(async function () {
  await Unique.syncIndexes({ background: true });
  await Unique.deleteMany({});
});
