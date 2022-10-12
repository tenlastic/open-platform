import { BaseModel } from './base';

export class NamespaceLogModel extends BaseModel {
  public body: string;
  public namespaceId: string;
  public nodeId: string;
  public unix: number;

  constructor(parameters?: Partial<NamespaceLogModel>) {
    super(parameters);
  }
}
