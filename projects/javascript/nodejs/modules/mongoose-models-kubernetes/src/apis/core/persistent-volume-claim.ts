import * as k8s from '@kubernetes/client-node';

import { BaseApiV1 } from '../bases';

const kc = new k8s.KubeConfig();
kc.loadFromDefault();

export class PersistentVolumeClaimApiV1 extends BaseApiV1<k8s.V1PersistentVolumeClaim> {
  protected api = kc.makeApiClient(k8s.CoreV1Api);
  protected singular = 'PersistentVolumeClaim';

  public resize(name: string, namespace: string, size: number) {
    return this.patch(name, namespace, {
      spec: { resources: { requests: { storage: `${size}` } } },
    });
  }
}

export const persistentVolumeClaimApiV1 = new PersistentVolumeClaimApiV1();
