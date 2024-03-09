import { BaseModel } from './base';

export class SteamApiKeyModel extends BaseModel {
  public appId: number;
  public name: string;
  public namespaceId: string;
  public value: string;

  constructor(parameters?: Partial<SteamApiKeyModel>) {
    super(parameters);
  }
}
