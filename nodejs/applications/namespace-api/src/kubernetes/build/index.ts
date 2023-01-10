import { BuildDocument } from '@tenlastic/mongoose';
import { DatabaseOperationType } from '@tenlastic/mongoose-nats';

import { KubernetesBuildApplication } from './application';
import { KubernetesBuildNetworkPolicy } from './network-policy';
import { KubernetesBuildSidecar } from './sidecar';

export const KubernetesBuild = {
  delete: async (build: BuildDocument, operationType?: DatabaseOperationType) => {
    await Promise.all([
      KubernetesBuildApplication.delete(build, operationType),
      KubernetesBuildNetworkPolicy.delete(build),
      KubernetesBuildSidecar.delete(build),
    ]);
  },
  getLabels: (build: BuildDocument) => {
    const name = KubernetesBuild.getName(build);

    return {
      'tenlastic.com/app': name,
      'tenlastic.com/buildId': `${build._id}`,
      'tenlastic.com/namespaceId': `${build.namespaceId}`,
    };
  },
  getName: (build: BuildDocument) => {
    return `build-${build._id}`;
  },
  terminate: async (build: BuildDocument) => {
    await KubernetesBuildApplication.terminate(build);
  },
  upsert: async (build: BuildDocument) => {
    await Promise.all([
      KubernetesBuildApplication.upsert(build),
      KubernetesBuildNetworkPolicy.upsert(build),
      KubernetesBuildSidecar.upsert(build),
    ]);
  },
};
