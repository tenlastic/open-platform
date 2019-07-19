import * as mongoose from 'mongoose';

import { PasswordReset, User } from './models';

const url = process.env.MONGO_CONNECTION_STRING;
mongoose.connect(url, { useFindAndModify: false, useNewUrlParser: true });

beforeEach(async function() {
  await PasswordReset.deleteMany({});
  await User.deleteMany({});
});
