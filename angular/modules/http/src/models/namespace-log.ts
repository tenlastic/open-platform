import { Model } from './model';

export class NamespaceLog extends Model {
  public body: string;
  public namespaceId: string;
  public nodeId: string;
  public unix: number;

  constructor(params?: Partial<NamespaceLog>) {
    super(params);
  }
}
