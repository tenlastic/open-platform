import { buildQuery } from '../stores/build';
import { BaseModel } from './base';
import { GameServerModel } from './game-server';

export namespace IQueue {
  export const Cpu = [
    { label: '0.1', value: 0.1 },
    { label: '0.25', value: 0.25 },
    { label: '0.5', value: 0.5 },
  ];
  export const Memory = [
    { label: '100 MB', value: 100 * 1000 * 1000 },
    { label: '250 MB', value: 250 * 1000 * 1000 },
    { label: '500 MB', value: 500 * 1000 * 1000 },
    { label: '1 GB', value: 100 * 1000 * 1000 },
    { label: '2.5 GB', value: 250 * 1000 * 1000 },
    { label: '5 GB', value: 500 * 1000 * 1000 },
  ];
  export const Replicas = [
    { label: '1', value: 1 },
    { label: '3', value: 3 },
    { label: '5', value: 5 },
  ];

  export interface Status {
    components?: StatusComponent[];
    nodes?: StatusNode[];
    phase: string;
  }

  export interface StatusComponent {
    current: number;
    name: string;
    phase: string;
    total: number;
  }

  export interface StatusNode {
    _id: string;
    phase: string;
  }
}

export class QueueModel extends BaseModel {
  public _id: string;
  public get build() {
    return buildQuery.getEntity(this.buildId);
  }
  public buildId: string;
  public cpu: number;
  public createdAt: Date;
  public description: string;
  public gameServerTemplate: Partial<GameServerModel>;
  public memory: number;
  public metadata: any;
  public name: string;
  public namespaceId: string;
  public preemptible: boolean;
  public replicas: number;
  public status: IQueue.Status;
  public teams: number;
  public updatedAt: Date;
  public usersPerTeam: number;

  constructor(parameters: Partial<QueueModel> = {}) {
    super(parameters);
  }

  public static isRestartRequired(fields: string[]) {
    const immutableFields = [
      'buildId',
      'cpu',
      'gameServerTemplate',
      'memory',
      'preemptible',
      'replicas',
      'teams',
      'usersPerTeam',
    ];
    return immutableFields.some((i) => fields.includes(i));
  }
}
