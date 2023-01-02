import { V1Deployment, V1StatefulSet } from '@kubernetes/client-node';

export interface Component {
  current: number;
  name: string;
  phase: string;
  total: number;
}

export function getComponents(deployments: V1Deployment[], statefulSets: V1StatefulSet[]) {
  return deployments
    .concat(statefulSets)
    .map((ds) => ({
      current: ds.status.readyReplicas || 0,
      name: ds.metadata.labels['tenlastic.com/role'],
      phase: ds.spec.replicas === ds.status.readyReplicas ? 'Running' : 'Pending',
      total: ds.spec.replicas,
    }))
    .sort((a, b) => (a.name > b.name ? 1 : -1));
}
