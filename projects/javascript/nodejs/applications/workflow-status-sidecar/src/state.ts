export interface NodeState {
  id: string;
  isFinished?: boolean;
  phase: string;
}

export async function setPhase(id: string, phase: string) {
  state[id] = state[id] || { id, phase };

  if (phase === 'Pending') {
    return;
  }

  const node = state[id];
  node.isFinished = phase === 'Error' || phase === 'Failed' || phase === 'Succeeded';
}

export const state: { [key: string]: NodeState } = {};
