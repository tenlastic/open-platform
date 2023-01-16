import { V1Deployment, V1Job, V1Pod, V1StatefulSet } from '@kubernetes/client-node';

export interface Component {
  current?: number;
  name: string;
  phase: string;
  total?: number;
}

export function getComponents(
  deployments: V1Deployment[],
  jobs: V1Job[],
  pods: V1Pod[],
  statefulSets: V1StatefulSet[],
) {
  const components = [
    ...deployments.map(getReplicaSetComponents),
    ...jobs.map((job) => getJobComponents(job, pods)),
    ...statefulSets.map(getReplicaSetComponents),
  ];

  return components.sort((a, b) => (a.name > b.name ? 1 : -1));
}

function getJobComponents(job: V1Job, pods: V1Pod[]) {
  const name = job.metadata.labels['tenlastic.com/role'];

  if (job.status.completionTime) {
    return { current: 0, name, phase: 'Succeeded', total: 0 };
  }

  const pod = pods.find((p) => job.metadata.name === p.metadata.labels['job-name']);
  if (!pod || pod.status.phase === 'Succeeded') {
    return { current: 0, name, phase: 'Succeeded', total: 0 };
  }

  const condition = pod.status.conditions.find((c) => c.type === 'Ready');
  const ready = condition.status === 'True' || condition.reason === 'PodCompleted';

  return { current: ready ? 1 : 0, name, phase: ready ? 'Running' : 'Pending', total: 1 };
}

function getReplicaSetComponents(replicaSet: V1Deployment | V1StatefulSet) {
  return {
    current: replicaSet.status.readyReplicas || 0,
    name: replicaSet.metadata.labels['tenlastic.com/role'],
    phase: replicaSet.spec.replicas === replicaSet.status.readyReplicas ? 'Running' : 'Pending',
    total: replicaSet.spec.replicas,
  };
}
