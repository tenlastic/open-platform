import { namespaceQuery } from '../stores/namespace';
import { BaseModel } from './base';

export class ModuleModel extends BaseModel {
  public get namespace() {
    return namespaceQuery.getEntity(this.namespaceId);
  }
  public namespaceId: string;
  public type: string;

  constructor(parameters: Partial<ModuleModel> = {}) {
    super(parameters);
  }
}
