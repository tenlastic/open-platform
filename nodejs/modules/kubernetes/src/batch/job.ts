import * as k8s from '@kubernetes/client-node';

import { BaseApiV1 } from '../bases';

const kc = new k8s.KubeConfig();
kc.loadFromDefault();

export class JobApiV1 extends BaseApiV1<k8s.V1Job> {
  protected api = kc.makeApiClient(k8s.BatchV1Api);
  protected singular = 'Job';

  protected getEndpoint(namespace: string) {
    return `/apis/batch/v1/namespaces/${namespace}/jobs`;
  }
}

export const jobApiV1 = new JobApiV1();
