import { Model } from './model';

export class Ignoration extends Model {
  public fromUserId: string;
  public toUserId: string;

  constructor(params?: Partial<Ignoration>) {
    super(params);
  }
}
