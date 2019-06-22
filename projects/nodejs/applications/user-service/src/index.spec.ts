import * as mongoose from 'mongoose';

import { User } from './models';

const url = process.env.MONGO_CONNECTION_STRING;
mongoose.connect(url, { useFindAndModify: false, useNewUrlParser: true });

beforeEach(async function() {
  await User.deleteMany({});
});
