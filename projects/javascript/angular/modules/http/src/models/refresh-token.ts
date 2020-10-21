import { Model } from './model';

export class RefreshToken extends Model {
  public description: string;
  public expiresAt: Date;
  public userId: string;

  constructor(params: Partial<RefreshToken> = {}) {
    super(params);

    this.expiresAt = params.expiresAt ? new Date(params.expiresAt) : null;
  }
}
