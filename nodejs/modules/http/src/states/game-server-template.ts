import { GameServerTemplateModel } from '../models';
import { GameServerTemplateService } from '../services';
import { BaseState } from './base';

export class GameServerTemplateState extends BaseState<
  GameServerTemplateModel,
  GameServerTemplateService
> {
  constructor(service: GameServerTemplateService) {
    super('_id', service);
  }
}
