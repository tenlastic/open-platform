import { BaseModel } from './base';

export class WebSocketModel extends BaseModel {
  public namespaceId: string;
  public userId: string;

  constructor(parameters: Partial<WebSocketModel> = {}) {
    super(parameters);
  }
}
