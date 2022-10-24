import { BaseModel } from './base';

export class QueueLogModel extends BaseModel {
  public body: string;
  public container: string;
  public pod: string;
  public queueId: string;
  public unix: number;

  constructor(parameters?: Partial<QueueLogModel>) {
    super(parameters);
  }
}
