import { buildQuery } from '../stores/build';
import { BaseModel } from './base';

export class BuildLogModel extends BaseModel {
  public body: string;
  public get build() {
    return buildQuery.getEntity(this.buildId);
  }
  public buildId: string;
  public nodeId: string;
  public unix: number;

  constructor(parameters: Partial<BuildLogModel> = {}) {
    super(parameters);
  }
}
