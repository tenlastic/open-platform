import { BaseLogModel } from './base-log';

export class NamespaceLogModel extends BaseLogModel {
  public namespaceId: string;

  constructor(parameters?: Partial<NamespaceLogModel>) {
    super(parameters);
  }
}
