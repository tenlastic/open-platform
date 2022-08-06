import { BaseModel } from './base';

export namespace IGameServer {
  export const Cpu = [
    { label: '0.1', value: 0.1 },
    { label: '0.25', value: 0.25 },
    { label: '0.5', value: 0.5 },
    { label: '1', value: 1 },
  ];
  export const Memory = [
    { label: '100 MB', value: 100 * 1000 * 1000 },
    { label: '250 MB', value: 250 * 1000 * 1000 },
    { label: '500 MB', value: 500 * 1000 * 1000 },
    { label: '1 GB', value: 1 * 1000 * 1000 * 1000 },
    { label: '2.5 GB', value: 2.5 * 1000 * 1000 * 1000 },
    { label: '5 GB', value: 5 * 1000 * 1000 * 1000 },
  ];

  export interface Endpoints {
    tcp?: string;
    udp?: string;
    websocket?: string;
  }

  export interface Status {
    endpoints?: Endpoints;
    nodes?: StatusNode[];
    phase: string;
    version?: string;
  }

  export interface StatusNode {
    _id: string;
    displayName: string;
    phase: string;
  }
}

export class GameServerModel extends BaseModel {
  public authorizedUserIds: string[];
  public buildId: string;
  public cpu: number;
  public currentUserIds: string[];
  public description: string;
  public memory: number;
  public metadata: any;
  public name: string;
  public namespaceId: string;
  public persistent: boolean;
  public preemptible: boolean;
  public queueId: string;
  public restartedAt: Date;
  public status: IGameServer.Status;

  constructor(parameters?: Partial<GameServerModel>) {
    super(parameters);
  }

  public static isRestartRequired(fields: string[]) {
    const immutableFields = ['buildId', 'cpu', 'memory', 'preemptible', 'restartedAt'];

    return immutableFields.some((i) => fields.includes(i));
  }
}
