import { BaseModel } from './base';

export namespace IQueue {
  export interface GameServerTemplate {
    buildId?: string;
    cpu?: number;
    isPreemptible?: boolean;
    memory?: number;
    metadata?: any;
  }
}

export interface QueueModel extends BaseModel {
  description?: string;
  gameId?: string;
  gameServerTemplate?: IQueue.GameServerTemplate;
  name?: string;
  namespaceId?: string;
  teams?: number;
  usersPerTeam?: number;
}
