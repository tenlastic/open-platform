import { Build } from './build';
import { Model } from './model';

export class BuildLog extends Model {
  public body: string;
  public build: Build;
  public buildId: string;
  public nodeId: string;
  public unix: number;

  constructor(params?: Partial<BuildLog>) {
    super(params);

    this.build = this.build ? new Build(this.build) : null;
  }
}
