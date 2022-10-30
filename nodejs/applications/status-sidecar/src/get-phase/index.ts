import { Component } from '../get-components';
import { NamespaceLimitError } from '../get-message';
import { Node } from '../get-nodes';

export function getPhase(components: Component[], message: string, nodes: Node[]) {
  if (message === NamespaceLimitError) {
    return 'Error';
  }

  let phase = 'Pending';
  if (components.every((c) => c.phase === 'Running')) {
    phase = 'Running';
  } else if (nodes.some((n) => n.phase === 'Error')) {
    phase = 'Error';
  }

  return phase;
}
