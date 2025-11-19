import { WebSocketModel } from '../models';
import { WebSocketService } from '../services';
import { BaseState } from './base';

export class WebSocketState extends BaseState<WebSocketModel, WebSocketService> {
  constructor(service: WebSocketService) {
    super('_id', service);
  }
}
