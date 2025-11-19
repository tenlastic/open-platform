import { NamespaceLogModel } from '../models';
import { NamespaceLogService } from '../services';
import { BaseState } from './base';

export class NamespaceLogState extends BaseState<NamespaceLogModel, NamespaceLogService> {
  constructor(service: NamespaceLogService) {
    super('unix', service);
  }
}
