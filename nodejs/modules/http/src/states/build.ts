import { BuildModel } from '../models';
import { BuildService } from '../services';
import { BaseState } from './base';

export class BuildState extends BaseState<BuildModel, BuildService> {
  constructor(service: BuildService) {
    super('_id', service);
  }
}
