import * as k8s from '@kubernetes/client-node';

import { ClusterBaseApiV1 } from '../bases';

const kc = new k8s.KubeConfig();
kc.loadFromDefault();

export class NodeApiV1 extends ClusterBaseApiV1<k8s.V1Node> {
  protected api = kc.makeApiClient(k8s.CoreV1Api);
  protected singular = 'Node';
}

export const nodeApiV1 = new NodeApiV1();
