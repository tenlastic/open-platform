import { BaseModel } from './base';

export namespace IQueue {
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
  export const Replicas = [
    { label: '1', value: 1 },
    { label: '3', value: 3 },
    { label: '5', value: 5 },
  ];

  export enum StatusComponentName {
    Application = 'Application',
    Sidecar = 'Sidecar',
  }

  export interface GameServerTemplate {
    buildId: string;
    cpu: number;
    memory: number;
    metadata?: any;
    preemptible: boolean;
  }

  export interface Status {
    components?: StatusComponent[];
    message?: string;
    nodes?: StatusNode[];
    phase: string;
    version?: string;
  }

  export interface StatusComponent {
    current: number;
    name: StatusComponentName;
    phase: string;
    total: number;
  }

  export interface StatusNode {
    component: StatusComponentName;
    container: string;
    phase: string;
    pod: string;
  }
}

export class QueueModel extends BaseModel {
  public cpu: number;
  public description: string;
  public gameServerTemplate: IQueue.GameServerTemplate;
  public memory: number;
  public metadata: any;
  public name: string;
  public namespaceId: string;
  public preemptible: boolean;
  public replicas: number;
  public restartedAt: Date;
  public status: IQueue.Status;
  public teams: number;
  public usersPerTeam: number;

  constructor(parameters?: Partial<QueueModel>) {
    super(parameters);
  }

  public static isRestartRequired(fields: string[]) {
    const immutableFields = [
      'cpu',
      'gameServerTemplate',
      'memory',
      'preemptible',
      'replicas',
      'restartedAt',
    ];
    return immutableFields.some((i) => fields.includes(i));
  }
}
