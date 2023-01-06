import { BaseLogModel } from './base-log';

export class BuildLogModel extends BaseLogModel {
  public buildId: string;

  constructor(parameters?: Partial<BuildLogModel>) {
    super(parameters);
  }
}
