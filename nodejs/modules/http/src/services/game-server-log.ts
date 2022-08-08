import { GameServerLogModel } from '../models/game-server-log';
import { GameServerLogStore } from '../states/game-server-log';
import { ApiService } from './api';
import { EnvironmentService } from './environment';

export interface GameServerLogsQuery {
  since?: string;
  tail?: number;
}

export class GameServerLogService {
  constructor(
    private apiService: ApiService,
    private environmentService: EnvironmentService,
    private gameServerLogStore: GameServerLogStore,
  ) {}

  /**
   * Returns an array of Records satisfying the query.
   */
  public async find(
    namespaceId: string,
    gameServerId: string,
    nodeId: string,
    query: GameServerLogsQuery,
  ) {
    const url = this.getUrl(namespaceId, gameServerId);
    const response = await this.apiService.request({
      method: 'get',
      params: query,
      url: `${url}/${nodeId}`,
    });

    const records = response.data.records.map(
      (record) => new GameServerLogModel({ ...record, gameServerId, nodeId }),
    );
    this.gameServerLogStore.upsertMany(records);

    return records;
  }

  /**
   * Returns the base URL for this Model.
   */
  private getUrl(namespaceId: string, gameServerId: string) {
    const { apiUrl } = this.environmentService;
    return `${apiUrl}/namespaces/${namespaceId}/game-servers/${gameServerId}/logs`;
  }
}
