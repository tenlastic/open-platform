import { SinonSandbox } from 'sinon';

import { GameServer, Namespace, Pipeline } from './models';

export function stub(sandbox: SinonSandbox) {
  sandbox.stub(GameServer.prototype, 'createKubernetesResources').resolves();
  sandbox.stub(GameServer.prototype, 'deleteKubernetesResources').resolves();
  sandbox.stub(GameServer.prototype, 'updateKubernetesResources').resolves();
  sandbox.stub(Namespace.prototype, 'deleteKubernetesResources').resolves();
  sandbox.stub(Namespace.prototype, 'upsertKubernetesResources').resolves();
  sandbox.stub(Pipeline.prototype, 'createKubernetesResources').resolves();
  sandbox.stub(Pipeline.prototype, 'deleteKubernetesResources').resolves();
}
