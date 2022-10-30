import { V1ResourceQuota } from '@kubernetes/client-node';

export function getCpu(resourceQuotas: V1ResourceQuota[]) {
  return resourceQuotas.reduce((p, c) => p + parse(c.status.used.cpu), 0);
}

function parse(input: string) {
  if (!input) {
    return 0;
  }

  const match = input.match(/^([0-9]+)m$/);
  const value = parseFloat(match ? match[1] : input);

  return match ? value / 1000 : value;
}
