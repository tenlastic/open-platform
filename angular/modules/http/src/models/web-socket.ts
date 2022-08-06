import { BaseModel } from './base';

export class WebSocketModel extends BaseModel {
  public disconnectedAt: Date;
  public namespaceId: string;
  public userId: string;

  constructor(parameters?: Partial<WebSocketModel>) {
    super(parameters);

    this.disconnectedAt = parameters.disconnectedAt ? new Date(parameters.disconnectedAt) : null;
  }

  public get duration() {
    if (!this.disconnectedAt) {
      return 0;
    }

    return this.disconnectedAt.getTime() - this.createdAt.getTime();
  }
}
