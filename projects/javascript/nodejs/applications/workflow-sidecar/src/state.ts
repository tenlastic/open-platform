import { getLogs } from './logs';

export interface NodeState {
  id: string;
  isFinished?: boolean;
  isLogged?: boolean;
  isLogging?: boolean;
  phase: string;
}

export async function setPhase(id: string, phase: string) {
  state[id] = state[id] || { id, phase };

  if (phase === 'Pending') {
    return;
  }

  const node = state[id];
  node.isFinished = phase === 'Error' || phase === 'Failed' || phase === 'Succeeded';

  if (!node.isLogging) {
    node.isLogging = true;

    const emitter = await getLogs(node.id);
    emitter.on('end', () => (node.isLogged = true));
  }
}

export const state: { [key: string]: NodeState } = {};
