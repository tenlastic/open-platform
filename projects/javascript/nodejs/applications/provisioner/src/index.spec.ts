import * as mailgun from '@tenlastic/mailgun';
import * as minio from '@tenlastic/minio';
import * as mongooseModels from '@tenlastic/mongoose-models';
import * as sinon from 'sinon';
import { URL } from 'url';

let sandbox: sinon.SinonSandbox;

before(async function() {
  await mongooseModels.connect({
    connectionString: process.env.MONGO_CONNECTION_STRING,
    databaseName: `api-test`,
  });
  await mongooseModels.syncIndexes();
});

beforeEach(async function() {
  sandbox = sinon.createSandbox();
  sandbox.stub(mailgun, 'send').resolves();
});

afterEach(function() {
  sandbox.restore();
});
