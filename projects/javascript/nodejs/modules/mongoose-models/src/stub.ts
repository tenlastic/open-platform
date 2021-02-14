import { SinonSandbox } from 'sinon';

import * as kubernetes from './kubernetes';

export function stub(sandbox: SinonSandbox) {
  sandbox.stub(kubernetes.Build, 'create').resolves();
  sandbox.stub(kubernetes.Build, 'delete').resolves();
  sandbox.stub(kubernetes.BuildSidecar, 'create').resolves();
  sandbox.stub(kubernetes.BuildSidecar, 'delete').resolves();
  sandbox.stub(kubernetes.GameServer, 'create').resolves();
  sandbox.stub(kubernetes.GameServer, 'delete').resolves();
  sandbox.stub(kubernetes.GameServerSidecar, 'create').resolves();
  sandbox.stub(kubernetes.GameServerSidecar, 'delete').resolves();
  sandbox.stub(kubernetes.Namespace, 'create').resolves();
  sandbox.stub(kubernetes.Namespace, 'delete').resolves();
  sandbox.stub(kubernetes.Workflow, 'create').resolves();
  sandbox.stub(kubernetes.Workflow, 'delete').resolves();
  sandbox.stub(kubernetes.WorkflowSidecar, 'create').resolves();
  sandbox.stub(kubernetes.WorkflowSidecar, 'delete').resolves();
}
