import { CustomObjectBaseApiV1 } from '../bases';

export interface V1GitRepository {
  metadata: {
    annotations?: { [key: string]: string };
    labels?: { [key: string]: string };
    name: string;
    namespace?: string;
    resourceVersion?: string;
  };
  spec: {
    ignore?: string;
    interval: string;
    ref: { branch: string };
    url: string;
  };
}

export class GitRepositoryApiV1 extends CustomObjectBaseApiV1<V1GitRepository> {
  protected group = 'source.toolkit.fluxcd.io';
  protected kind = 'GitRepository';
  protected plural = 'gitrepositories';
  protected version = 'v1beta2';
}

export const gitRepositoryApiV1 = new GitRepositoryApiV1();
