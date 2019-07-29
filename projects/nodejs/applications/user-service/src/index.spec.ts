import * as mailgun from '@tenlastic/mailgun-module';
import * as mongoose from 'mongoose';
import * as sinon from 'sinon';

import { PasswordReset, User } from './models';

const connectionString = process.env.MONGO_CONNECTION_STRING;
const databaseName = process.env.MONGO_DATABASE_NAME;
mongoose.connect(connectionString, {
  dbName: databaseName,
  useFindAndModify: false,
  useNewUrlParser: true,
});

let sandbox: sinon.SinonSandbox;

beforeEach(async function() {
  sandbox = sinon.createSandbox();
  sandbox.stub(mailgun, 'send').resolves();

  await PasswordReset.deleteMany({});
  await User.deleteMany({});
});

afterEach(function() {
  sandbox.restore();
});
