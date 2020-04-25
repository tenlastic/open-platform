import * as kafka from '@tenlastic/mongoose-change-stream-kafka';
import * as mailgun from '@tenlastic/mailgun';
import * as mongoose from 'mongoose';
import * as sinon from 'sinon';

import { MONGO_DATABASE_NAME } from './constants';
import { Connection, PasswordReset, RefreshToken, User } from './models';

before(async function() {
  await kafka.connect(process.env.KAFKA_CONNECTION_STRING.split(','));
  await mongoose.connect(process.env.MONGO_CONNECTION_STRING, {
    dbName: `${MONGO_DATABASE_NAME}-test`,
    useCreateIndex: true,
    useFindAndModify: false,
    useNewUrlParser: true,
    useUnifiedTopology: true,
  });
});

let sandbox: sinon.SinonSandbox;

beforeEach(async function() {
  sandbox = sinon.createSandbox();
  sandbox.stub(mailgun, 'send').resolves();

  await Connection.deleteMany({});
  await PasswordReset.deleteMany({});
  await RefreshToken.deleteMany({});
  await User.deleteMany({});
});

afterEach(function() {
  sandbox.restore();
});
