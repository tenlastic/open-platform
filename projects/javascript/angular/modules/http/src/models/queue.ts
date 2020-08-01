import { Model } from './model';

export class Queue extends Model {
  public _id: string;
  public createdAt: Date;
  public description: string;
  public gameId: string;
  public metadata: any;
  public name: string;
  public playersPerTeam: number;
  public teams: number;
  public updatedAt: Date;

  constructor(params: Partial<Queue> = {}) {
    super(params);
  }
}
