import { BaseModel } from './base';

export interface GameServerModel extends BaseModel {
  authorizedUserIds: string[];
  buildId: string;
  cpu: number;
  description: string;
  gameId: string;
  memory: number;
  metadata: any;
  name: string;
  namespaceId: string;
  persistent: boolean;
  preemptible: boolean;
  queueId: string;
}
