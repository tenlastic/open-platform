import { V1ResourceQuota } from '@kubernetes/client-node';

export function getMemory(resourceQuotas: V1ResourceQuota[]) {
  return resourceQuotas.reduce((p, c) => p + parse(c.status.used.memory), 0);
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
