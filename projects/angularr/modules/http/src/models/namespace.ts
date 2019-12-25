import { Model } from './model';

export namespace INamespace {
  export interface AccessControlListItem {
    roles: string[];
    userId: string;
  }
}

export class Namespace extends Model {
  public accessControlList: INamespace.AccessControlListItem[];
  public name: string;

  constructor(params?: Partial<Namespace>) {
    super(params);
  }
}
