import { BaseModel } from './base';

export class NamespaceLogModel extends BaseModel {
  public body: string;
  public container: string;
  public namespaceId: string;
  public pod: string;
  public unix: number;

  constructor(parameters?: Partial<NamespaceLogModel>) {
    super(parameters);
  }
}
