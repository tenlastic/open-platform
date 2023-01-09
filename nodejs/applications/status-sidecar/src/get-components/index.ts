import { V1Deployment, V1Job, V1StatefulSet } from '@kubernetes/client-node';

export interface Component {
  current?: number;
  name: string;
  phase: string;
  total?: number;
}

export function getComponents(
  deployments: V1Deployment[],
  jobs: V1Job[],
  statefulSets: V1StatefulSet[],
) {
  const components = [
    ...deployments.map(getReplicaSetComponents),
    ...jobs.map(getJobComponents),
    ...statefulSets.map(getReplicaSetComponents),
  ];

  return components.sort((a, b) => (a.name > b.name ? 1 : -1));
}

function getJobComponents(job: V1Job) {
  return {
    name: job.metadata.labels['tenlastic.com/role'],
    phase: job.status.completionTime ? 'Succeeded' : job.status.active ? 'Running' : 'Pending',
  };
}

function getReplicaSetComponents(replicaSet: V1Deployment | V1StatefulSet) {
  return {
    current: replicaSet.status.readyReplicas || 0,
    name: replicaSet.metadata.labels['tenlastic.com/role'],
    phase: replicaSet.spec.replicas === replicaSet.status.readyReplicas ? 'Running' : 'Pending',
    total: replicaSet.spec.replicas,
  };
}
