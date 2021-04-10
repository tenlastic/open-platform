import * as k8s from '@kubernetes/client-node';

import { BaseApiV1 } from '../bases';

const kc = new k8s.KubeConfig();
kc.loadFromDefault();

export class DeploymentApiV1 extends BaseApiV1<k8s.V1Deployment> {
  protected api = kc.makeApiClient(k8s.AppsV1Api);
  protected singular = 'Deployment';
}

export const deploymentApiV1 = new DeploymentApiV1();
