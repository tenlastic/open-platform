import { Model } from './model';

export class GameServer extends Model {
  public currentUserIds: string[];
  public description: string;
  public gameId: string;
  public heartbeatAt: Date;
  public isPersistent: boolean;
  public isPreemptible: boolean;
  public metadata: any;
  public name: string;
  public releaseId: string;
  public url: string;

  constructor(params: Partial<GameServer> = {}) {
    super(params);

    this.heartbeatAt = params.heartbeatAt ? new Date(params.heartbeatAt) : null;
  }
}
