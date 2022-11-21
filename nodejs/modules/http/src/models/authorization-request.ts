import { BaseModel } from './base';
import { IAuthorization } from './authorization';

export class AuthorizationRequestModel extends BaseModel {
  public deniedAt: Date;
  public grantedAt: Date;
  public namespaceId: string;
  public roles: IAuthorization.Role[];
  public userId: string;

  constructor(parameters?: Partial<AuthorizationRequestModel>) {
    super(parameters);

    this.deniedAt = parameters?.deniedAt ? new Date(parameters.deniedAt) : null;
    this.grantedAt = parameters?.grantedAt ? new Date(parameters.grantedAt) : null;
  }

  public hasRoles(roles: IAuthorization.Role[]) {
    return this.roles?.some((r) => roles.includes(r));
  }
}
