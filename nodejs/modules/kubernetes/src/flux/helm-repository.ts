import { CustomObjectBaseApiV1 } from '../bases';

export interface V1HelmRepository {
  metadata: {
    annotations?: { [key: string]: string };
    labels?: { [key: string]: string };
    name: string;
    namespace?: string;
    resourceVersion?: string;
  };
  spec: {
    interval: string;
    url: string;
  };
}

export class HelmRepositoryApiV1 extends CustomObjectBaseApiV1<V1HelmRepository> {
  protected group = 'source.toolkit.fluxcd.io';
  protected kind = 'HelmRepository';
  protected plural = 'helmrepositories';
  protected version = 'v1beta2';
}

export const helmRepositoryApiV1 = new HelmRepositoryApiV1();
