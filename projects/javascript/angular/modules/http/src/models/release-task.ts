import { Model } from './model';

export namespace IReleaseTask {
  export interface Failure {
    createdAt: Date;
    message: string;
  }
}

export class ReleaseTask extends Model {
  public _id: string;
  public completedAt: Date;
  public createdAt: Date;
  public failedAt: Date;
  public failures: IReleaseTask.Failure[];
  public metadata: any;
  public platform: string;
  public releaseId: string;
  public startedAt: Date;
  public updatedAt: Date;

  constructor(params: Partial<ReleaseTask> = {}) {
    super(params);

    this.completedAt = params.completedAt ? new Date(params.completedAt) : null;
    this.failedAt = params.failedAt ? new Date(params.failedAt) : null;
    this.startedAt = params.startedAt ? new Date(params.startedAt) : null;
  }
}
