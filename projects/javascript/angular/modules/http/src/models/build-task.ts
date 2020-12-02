import { Model } from './model';

export namespace IBuildTask {
  export interface Failure {
    createdAt: Date;
    message: string;
  }
}

export class BuildTask extends Model {
  public _id: string;
  public buildId: string;
  public completedAt: Date;
  public createdAt: Date;
  public failedAt: Date;
  public failures: IBuildTask.Failure[];
  public metadata: any;
  public platform: string;
  public startedAt: Date;
  public updatedAt: Date;

  constructor(params: Partial<BuildTask> = {}) {
    super(params);

    this.completedAt = params.completedAt ? new Date(params.completedAt) : null;
    this.failedAt = params.failedAt ? new Date(params.failedAt) : null;
    this.startedAt = params.startedAt ? new Date(params.startedAt) : null;
  }
}
