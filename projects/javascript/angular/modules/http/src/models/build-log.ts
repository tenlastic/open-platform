import { Model } from './model';

export class BuildLog extends Model {
  public body: string;
  public buildId: string;
  public nodeId: string;
  public unix: number;

  constructor(params?: Partial<BuildLog>) {
    super(params);
  }
}
