import { BaseModel } from './base';

export class BuildLogModel extends BaseModel {
  public body: string;
  public buildId: string;
  public container: string;
  public pod: string;
  public unix: number;

  constructor(parameters?: Partial<BuildLogModel>) {
    super(parameters);
  }
}
