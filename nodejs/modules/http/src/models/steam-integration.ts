import { BaseModel } from './base';

export class SteamIntegrationModel extends BaseModel {
  public apiKey: string;
  public applicationId: number;
  public name: string;
  public namespaceId: string;

  constructor(parameters?: Partial<SteamIntegrationModel>) {
    super(parameters);
  }
}
