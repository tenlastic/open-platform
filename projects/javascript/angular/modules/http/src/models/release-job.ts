import { Model } from './model';

export namespace IReleaseJob {
  export interface Failure {
    createdAt: Date;
    message: string;
  }
}

export class ReleaseJob extends Model {
  public _id: string;
  public completedAt: Date;
  public createdAt: Date;
  public failures: IReleaseJob.Failure[];
  public metadata: any;
  public platform: string;
  public releaseId: string;
  public startedAt: Date;
  public updatedAt: Date;

  constructor(params: Partial<ReleaseJob> = {}) {
    super(params);

    this.completedAt = params.completedAt ? new Date(params.completedAt) : null;
    this.startedAt = params.startedAt ? new Date(params.startedAt) : null;
  }
}
