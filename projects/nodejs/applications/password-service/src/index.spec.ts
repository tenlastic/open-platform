import * as mongoose from 'mongoose';

import { Password } from './models';

const url = process.env.MONGO_CONNECTION_STRING;
mongoose.connect(url, { useFindAndModify: false, useNewUrlParser: true });

beforeEach(async function() {
  await Password.deleteMany({});
});
