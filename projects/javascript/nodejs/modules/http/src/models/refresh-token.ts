import { BaseModel } from './base';

export class RefreshTokenModel extends BaseModel {
  public description: string;
  public expiresAt: Date;
  public userId: string;

  constructor(parameters: Partial<RefreshTokenModel> = {}) {
    super(parameters);

    this.expiresAt = parameters.expiresAt ? new Date(parameters.expiresAt) : null;
  }
}
