import { V1Pod } from '@kubernetes/client-node';

export interface Node {
  component: string;
  container: string;
  phase: string;
  pod: string;
}

export function getNodes(pods: V1Pod[]) {
  return Object.values(pods)
    .filter((p) => !p.metadata.deletionTimestamp)
    .map<Node[]>((p) => {
      const component = p.metadata.labels['tenlastic.com/role'];

      return p.status.containerStatuses.map((cs) => {
        let phase = 'Pending';
        if (cs.state.running) {
          phase = cs.ready ? 'Running' : 'Pending';
        } else if (cs.state.terminated) {
          phase = cs.state.terminated.reason === 'Error' ? 'Failed' : 'Succeeded';
        }

        return { component, container: cs.name, phase, pod: p.metadata.name };
      });
    })
    .flat();
}
