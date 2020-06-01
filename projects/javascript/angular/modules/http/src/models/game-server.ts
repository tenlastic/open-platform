import { Model } from './model';

export class GameServer extends Model {
  public allowedUserIds: string[];
  public currentUserIds: string[];
  public description: string;
  public gameId: string;
  public heartbeatAt: Date;
  public maxUsers: number;
  public metadata: any;
  public name: string;
  public password: string;
  public releaseId: string;
  public url: string;

  constructor(params: Partial<GameServer> = {}) {
    super(params);

    this.heartbeatAt = params.heartbeatAt ? new Date(params.heartbeatAt) : null;
  }
}
