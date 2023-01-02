import { CustomObjectBaseApiV1 } from '../bases';

export interface V1HelmRelease {
  metadata: {
    annotations?: { [key: string]: string };
    labels?: { [key: string]: string };
    name: string;
    namespace?: string;
    resourceVersion?: string;
  };
  spec: {
    chart: {
      spec: {
        chart: string;
        sourceRef: {
          kind: string;
          name: string;
        };
      };
    };
    interval: string;
    releaseName: string;
    values?: any;
  };
}

export class HelmReleaseApiV1 extends CustomObjectBaseApiV1<V1HelmRelease> {
  protected group = 'helm.toolkit.fluxcd.io';
  protected kind = 'HelmRelease';
  protected plural = 'helmreleases';
  protected version = 'v2beta1';
}

export const helmReleaseApiV1 = new HelmReleaseApiV1();
