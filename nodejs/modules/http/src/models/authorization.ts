import { namespaceQuery } from '../stores/namespace';
import { userQuery } from '../stores/user';
import { BaseModel } from './base';

export namespace IAuthorization {
  export enum AuthorizationStatus {
    Granted = 'granted',
    Pending = 'pending',
    Revoked = 'revoked',
  }
}

export class AuthorizationModel extends BaseModel {
  public get namespace() {
    return namespaceQuery.getEntity(this.namespaceId);
  }
  public namespaceId: string;
  public status: IAuthorization.AuthorizationStatus;
  public get user() {
    return userQuery.getEntity(this.userId);
  }
  public userId: string;

  constructor(parameters: Partial<AuthorizationModel> = {}) {
    super(parameters);
  }
}
