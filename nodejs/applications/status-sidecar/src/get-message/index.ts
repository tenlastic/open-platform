import { CoreV1Event, V1Deployment, V1Job, V1StatefulSet } from '@kubernetes/client-node';

export const NamespaceLimitError = 'Namespace Limit reached.';

export function getMessage(
  deployments: V1Deployment[],
  events: { [key: string]: CoreV1Event },
  jobs: V1Job[],
  statefulSets: V1StatefulSet[],
) {
  for (const deployment of deployments) {
    if (!deployment.status.conditions) {
      continue;
    }

    for (const condition of deployment.status.conditions) {
      if (condition.message?.includes('exceeded quota')) {
        return NamespaceLimitError;
      }
    }
  }

  for (const job of jobs) {
    if (!job.status.conditions) {
      continue;
    }

    for (const condition of job.status.conditions) {
      if (condition.message?.includes('exceeded quota')) {
        return NamespaceLimitError;
      }
    }
  }

  for (const statefulSet of statefulSets) {
    const event = events[statefulSet.metadata.name];

    if (event?.message?.includes('exceeded quota')) {
      return NamespaceLimitError;
    }
  }

  return null;
}
