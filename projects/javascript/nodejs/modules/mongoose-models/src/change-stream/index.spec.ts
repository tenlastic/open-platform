import { Example } from './plugin/model';

beforeEach(async function () {
  await Example.deleteMany({});
});
