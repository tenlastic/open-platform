import { Component } from '../get-components';
import { Node } from '../get-nodes';

export function getPhase(components: Component[], message: string, nodes: Node[]) {
  let phase = 'Pending';
  if (components.every((c) => c.phase === 'Running')) {
    phase = 'Running';
  } else if (nodes.some((n) => n.phase === 'Error')) {
    phase = 'Error';
  }

  return phase;
}
