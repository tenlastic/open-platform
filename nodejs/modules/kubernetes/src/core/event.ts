import * as k8s from '@kubernetes/client-node';

import { BaseApiV1 } from '../bases';

const kc = new k8s.KubeConfig();
kc.loadFromDefault();

export class EventApiV1 extends BaseApiV1<k8s.CoreV1Event> {
  protected api = kc.makeApiClient(k8s.CoreV1Api);
  protected singular = 'Event';

  protected getEndpoint(namespace: string) {
    return `/api/v1/namespaces/${namespace}/events`;
  }
}

export const eventApiV1 = new EventApiV1();
