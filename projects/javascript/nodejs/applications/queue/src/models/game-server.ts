import { BaseModel } from './base';

export interface GameServerModel extends BaseModel {
  authorizedUserIds: string[];
  buildId: string;
  cpu: number;
  description: string;
  gameId: string;
  isPersistent: boolean;
  isPreemptible: boolean;
  memory: number;
  metadata: any;
  name: string;
  namespaceId: string;
  queueId: string;
}
