import { Model } from './model';

export namespace Namespace {
  export interface AccessControlListItem {
    roles: string[];
    userId: string;
  }
}

export class Namespace extends Model {
  public accessControlList: Namespace.AccessControlListItem[];
  public name: string;

  constructor(params?: Partial<Namespace>) {
    super(params);
  }
}
