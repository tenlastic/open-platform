import { Model } from './model';
import { Namespace } from './namespace';
import { User } from './user';

export namespace IAuthorization {
  export enum AuthorizationStatus {
    Granted = 'granted',
    Pending = 'pending',
    Revoked = 'revoked',
  }
}

export class Authorization extends Model {
  public namespace: Namespace;
  public namespaceId: string;
  public status: IAuthorization.AuthorizationStatus;
  public user: User;
  public userId: string;

  constructor(params?: Partial<Authorization>) {
    super(params);

    this.namespace = this.namespace ? new Namespace(this.namespace) : null;
    this.user = this.user ? new User(this.user) : null;
  }
}
