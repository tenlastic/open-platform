import { queueQuery } from '../stores/queue';
import { BaseModel } from './base';

export class QueueLogModel extends BaseModel {
  public body: string;
  public nodeId: string;
  public get queue() {
    return queueQuery.getEntity(this.queueId);
  }
  public queueId: string;
  public unix: number;

  constructor(parameters: Partial<QueueLogModel> = {}) {
    super(parameters);
  }
}
