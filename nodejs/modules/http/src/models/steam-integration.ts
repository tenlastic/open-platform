import { IAuthorization } from './authorization';
import { BaseModel } from './base';

export class SteamIntegrationModel extends BaseModel {
  public apiKey: string;
  public applicationId: number;
  public name: string;
  public namespaceId: string;
  public roles: IAuthorization.Role[];

  constructor(parameters?: Partial<SteamIntegrationModel>) {
    super(parameters);
  }
}
