import { Component } from '../get-components';
import { Node } from '../get-nodes';

export function getPhase(components: Component[], nodes: Node[]) {
  let phase = 'Pending';

  if (nodes.some((n) => n.phase === 'Error')) {
    phase = 'Error';
  } else if (components.every((c) => c.phase === 'Running' || c.phase === 'Succeeded')) {
    phase = 'Running';
  }

  return phase;
}
