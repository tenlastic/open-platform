import { SinonSandbox } from 'sinon';

import {
  KubernetesBuild,
  KubernetesBuildSidecar,
  KubernetesGameServer,
  KubernetesGameServerSidecar,
  KubernetesNamespace,
  KubernetesWorkflow,
  KubernetesWorkflowSidecar,
} from './kubernetes';

export function stub(sandbox: SinonSandbox) {
  sandbox.stub(KubernetesBuild, 'create').resolves();
  sandbox.stub(KubernetesBuild, 'delete').resolves();
  sandbox.stub(KubernetesBuildSidecar, 'create').resolves();
  sandbox.stub(KubernetesGameServer, 'create').resolves();
  sandbox.stub(KubernetesGameServer, 'delete').resolves();
  sandbox.stub(KubernetesGameServerSidecar, 'create').resolves();
  sandbox.stub(KubernetesGameServerSidecar, 'delete').resolves();
  sandbox.stub(KubernetesNamespace, 'create').resolves();
  sandbox.stub(KubernetesNamespace, 'delete').resolves();
  sandbox.stub(KubernetesWorkflow, 'create').resolves();
  sandbox.stub(KubernetesWorkflow, 'delete').resolves();
  sandbox.stub(KubernetesWorkflowSidecar, 'create').resolves();
}
