import { BaseModel } from './base';

export class QueueLogModel extends BaseModel {
  public body: string;
  public nodeId: string;
  public queueId: string;
  public unix: number;

  constructor(parameters?: Partial<QueueLogModel>) {
    super(parameters);
  }
}
