import * as mongooseModels from '@tenlastic/mongoose-models';
import { GameServer, Namespace } from '@tenlastic/mongoose-models';
import * as kafka from '@tenlastic/mongoose-change-stream-kafka';
import * as sinon from 'sinon';

let sandbox: sinon.SinonSandbox;

before(async function() {
  await kafka.connect(process.env.KAFKA_CONNECTION_STRING.split(','));

  await mongooseModels.connect({
    connectionString: process.env.MONGO_CONNECTION_STRING,
    databaseName: `api-test`,
  });
  await mongooseModels.syncIndexes();
});

beforeEach(async function() {
  sandbox = sinon.createSandbox();

  // Do not create Game Server resources within Kubernetes.
  sandbox.stub(GameServer.prototype, 'createKubernetesResources').resolves();
  sandbox.stub(GameServer.prototype, 'deleteKubernetesResources').resolves();
  sandbox.stub(GameServer.prototype, 'updateKubernetesResources').resolves();
  sandbox.stub(Namespace.prototype, 'upsertKubernetesResources').resolves();
  sandbox.stub(Namespace.prototype, 'deleteKubernetesResources').resolves();

  await mongooseModels.deleteAll();
});

afterEach(function() {
  sandbox.restore();
});
