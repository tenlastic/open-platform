import { Queue } from './queue';
import { Model } from './model';

export class QueueLog extends Model {
  public body: string;
  public queue: Queue;
  public queueId: string;
  public unix: number;

  constructor(params?: Partial<QueueLog>) {
    super(params);

    this.queue = this.queue ? new Queue(this.queue) : null;
  }
}
