import { BaseLogModel } from './base-log';

export class QueueLogModel extends BaseLogModel {
  public queueId: string;

  constructor(parameters?: Partial<QueueLogModel>) {
    super(parameters);
  }
}
