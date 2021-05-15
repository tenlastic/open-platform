import { CustomObjectBaseApiV1 } from '../bases';

export interface V1HelmRelease {
  metadata: {
    annotations?: { [key: string]: string };
    label?: { [key: string]: string };
    name: string;
    resourceVersion?: string;
  };
  spec: {
    chart: {
      name: string;
      repository: string;
      version: string;
    };
    releaseName: string;
    values?: object;
  };
}

export class HelmReleaseApiV1 extends CustomObjectBaseApiV1<V1HelmRelease> {
  protected group = 'helm.fluxcd.io';
  protected kind = 'HelmRelease';
  protected plural = 'helmreleases';
  protected version = 'v1';

  protected getEndpoint(namespace: string) {
    return `/apis/helm.fluxcd.io/v1/namespaces/${namespace}/helmreleases`;
  }
}

export const helmReleaseApiV1 = new HelmReleaseApiV1();
