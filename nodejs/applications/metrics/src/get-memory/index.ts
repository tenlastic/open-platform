import { V1Pod } from '@kubernetes/client-node';

export interface Node {
  component: string;
  container: string;
  phase: string;
  pod: string;
}

export function getMemory(pods: V1Pod[]) {
  let sum = 0;

  for (const pod of pods) {
    sum += pod.spec?.containers?.reduce((previous, current) => {
      const memory = current.resources?.requests?.memory || current.resources?.limits?.memory;
      return previous + parse(memory);
    }, 0);
  }

  return sum;
}

function parse(input: string) {
  if (!input) {
    return 0;
  }

  const multipliers = {
    E: Math.pow(1000, 6),
    Ei: Math.pow(1024, 6),
    G: Math.pow(1000, 3),
    Gi: Math.pow(1024, 3),
    k: 1000,
    Ki: 1024,
    M: Math.pow(1000, 2),
    Mi: Math.pow(1024, 2),
    P: Math.pow(1000, 5),
    Pi: Math.pow(1024, 5),
    T: Math.pow(1000, 4),
    Ti: Math.pow(1024, 4),
  };

  const match = input.match(/^([0-9]+)([A-Za-z]{1,2})$/);
  const value = parseInt(match ? match[1] : input, 10);

  return match ? value * multipliers[match[2]] : value;
}
