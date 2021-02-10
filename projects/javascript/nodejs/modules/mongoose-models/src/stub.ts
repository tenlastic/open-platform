import { SinonSandbox } from 'sinon';

import { GameServer, Namespace, Workflow, WorkflowSchema } from './models';

export function stub(sandbox: SinonSandbox) {
  sandbox.stub(GameServer.prototype, 'createKubernetesResources').resolves();
  sandbox.stub(GameServer.prototype, 'deleteKubernetesResources').resolves();
  sandbox.stub(GameServer.prototype, 'updateKubernetesResources').resolves();
  sandbox.stub(Namespace.prototype, 'deleteKubernetesResources').resolves();
  sandbox.stub(Namespace.prototype, 'upsertKubernetesResources').resolves();
  sandbox.stub(WorkflowSchema, 'deleteArgoHelmRelease').resolves();
  sandbox.stub(WorkflowSchema, 'upsertArgoHelmRelease').resolves();
  sandbox.stub(Workflow.prototype, 'createKubernetesResources').resolves();
  sandbox.stub(Workflow.prototype, 'deleteKubernetesResources').resolves();
}
