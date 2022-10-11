import { V1Pod } from '@kubernetes/client-node';

export interface Node {
  _id: string;
  phase: string;
  role: string;
}

export function getNodes(pods: V1Pod[]) {
  return Object.values(pods)
    .filter((p) => !p.metadata.deletionTimestamp)
    .map<Node>((p) => {
      const { conditions, phase } = p.status;
      const isReady = conditions?.find((c) => c.status === 'True' && c.type === 'ContainersReady');

      return {
        _id: p.metadata.name,
        phase: phase === 'Running' && !isReady ? 'Pending' : phase,
        role: p.metadata.labels['tenlastic.com/role'],
      };
    });
}
