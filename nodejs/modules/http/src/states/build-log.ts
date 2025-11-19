import { BuildLogModel } from '../models';
import { BuildLogService } from '../services';
import { BaseState } from './base';

export class BuildLogState extends BaseState<BuildLogModel, BuildLogService> {
  constructor(service: BuildLogService) {
    super('unix', service);
  }
}
