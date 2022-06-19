import { Model } from './model';

export class QueueLog extends Model {
  public body: string;
  public nodeId: string;
  public queueId: string;
  public unix: number;

  constructor(params?: Partial<QueueLog>) {
    super(params);
  }
}
