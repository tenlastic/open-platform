import { BaseModel } from './base';
import { IGameServer } from './game-server';

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
    ports?: IGameServer.Port[];
    preemptible: boolean;
    probes?: IGameServer.Probes;
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

  export interface Threshold {
    seconds?: number;
    usersPerTeam?: number[];
  }
}

export class QueueModel extends BaseModel {
  public cpu: number;
  public description: string;
  public gameServerTemplate: IQueue.GameServerTemplate;
  public memory: number;
  public name: string;
  public namespaceId: string;
  public preemptible: boolean;
  public replicas: number;
  public restartedAt: Date;
  public status: IQueue.Status;
  public thresholds: IQueue.Threshold[];
  public usersPerTeam: number[];

  constructor(parameters?: Partial<QueueModel>) {
    super(parameters);
  }

  /**
   * Returns true if the Queue will be restarted on update.
   */
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

  /**
   * Returns the number of teams accounting for Thresholds.
   */
  public getTeams(date: Date) {
    if (!date) {
      return this.usersPerTeam.length;
    }

    const milliseconds = new Date().getTime() - date.getTime();
    const seconds = milliseconds / 1000;

    const threshold = this.thresholds?.find((t) => t.seconds >= seconds);

    return threshold ? threshold.usersPerTeam.length : this.usersPerTeam.length;
  }

  /**
   * Returns the number of Users per team at the specified index accounting for Thresholds.
   */
  public getUsersPerTeam(date: Date, i: number) {
    if (!date) {
      return this.usersPerTeam[i];
    }

    const milliseconds = new Date().getTime() - date.getTime();
    const seconds = milliseconds / 1000;

    const threshold = this.thresholds?.find((t) => t.seconds >= seconds);

    return threshold ? threshold.usersPerTeam[i] : this.usersPerTeam[i];
  }
}
