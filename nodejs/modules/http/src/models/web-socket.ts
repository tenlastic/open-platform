import { BaseModel } from './base';

export class WebSocketModel extends BaseModel {
  public disconnectedAt: Date;
  public namespaceId: string;
  public userId: string;

  constructor(parameters?: Partial<WebSocketModel>) {
    super(parameters);

    if (parameters?.disconnectedAt) {
      this.disconnectedAt = new Date(parameters.disconnectedAt);
    }
  }
}
