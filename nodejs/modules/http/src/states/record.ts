import { RecordModel } from '../models';
import { RecordService } from '../services';
import { BaseState } from './base';

export class RecordState extends BaseState<RecordModel, RecordService> {
  constructor(service: RecordService) {
    super('_id', service);
  }
}
