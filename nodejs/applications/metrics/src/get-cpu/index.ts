import { V1Pod } from '@kubernetes/client-node';

export interface Node {
  component: string;
  container: string;
  phase: string;
  pod: string;
}

export function getCpu(pods: V1Pod[]) {
  let sum = 0;

  for (const pod of pods) {
    sum += pod.spec?.containers?.reduce((previous, current) => {
      const cpu = current.resources?.requests?.cpu || current.resources?.limits?.cpu;
      return previous + parse(cpu);
    }, 0);
  }

  return sum;
}

function parse(input: string) {
  if (!input) {
    return 0;
  }

  const match = input.match(/^([0-9]+)m$/);
  const value = parseFloat(match ? match[1] : input);

  return match ? value / 1000 : value;
}
