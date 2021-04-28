import * as k8s from '@tenlastic/kubernetes';
import { SinonSandbox } from 'sinon';

import {
  KubernetesBuild,
  KubernetesBuildSidecar,
  KubernetesDatabase,
  KubernetesDatabaseSidecar,
  KubernetesGameServer,
  KubernetesGameServerSidecar,
  KubernetesQueue,
  KubernetesQueueSidecar,
  KubernetesNamespace,
  KubernetesWorkflow,
  KubernetesWorkflowSidecar,
} from './';

export function stub(sandbox: SinonSandbox) {
  k8s.stub(sandbox);

  sandbox.stub(KubernetesBuild, 'delete').resolves();
  sandbox.stub(KubernetesBuild, 'upsert').resolves();
  sandbox.stub(KubernetesBuildSidecar, 'upsert').resolves();
  sandbox.stub(KubernetesDatabase, 'delete').resolves();
  sandbox.stub(KubernetesDatabase, 'upsert').resolves();
  sandbox.stub(KubernetesDatabaseSidecar, 'delete').resolves();
  sandbox.stub(KubernetesDatabaseSidecar, 'upsert').resolves();
  sandbox.stub(KubernetesGameServer, 'delete').resolves();
  sandbox.stub(KubernetesGameServer, 'upsert').resolves();
  sandbox.stub(KubernetesGameServerSidecar, 'delete').resolves();
  sandbox.stub(KubernetesGameServerSidecar, 'upsert').resolves();
  sandbox.stub(KubernetesNamespace, 'delete').resolves();
  sandbox.stub(KubernetesNamespace, 'upsert').resolves();
  sandbox.stub(KubernetesQueue, 'delete').resolves();
  sandbox.stub(KubernetesQueue, 'upsert').resolves();
  sandbox.stub(KubernetesQueueSidecar, 'delete').resolves();
  sandbox.stub(KubernetesQueueSidecar, 'upsert').resolves();
  sandbox.stub(KubernetesWorkflow, 'delete').resolves();
  sandbox.stub(KubernetesWorkflow, 'upsert').resolves();
  sandbox.stub(KubernetesWorkflowSidecar, 'upsert').resolves();
}
