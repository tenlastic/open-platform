import { gameQuery } from '../stores/game';
import { BaseModel } from './base';

export namespace IDatabase {
  export const Cpu = [
    { label: '0.1', value: 0.1 },
    { label: '0.25', value: 0.25 },
    { label: '0.5', value: 0.5 },
    { label: '1', value: 1 },
  ];
  export const Memory = [
    { label: '500 MB', value: 500 * 1000 * 1000 },
    { label: '1 GB', value: 1 * 1000 * 1000 * 1000 },
    { label: '2.5 GB', value: 2.5 * 1000 * 1000 * 1000 },
    { label: '5 GB', value: 5.0 * 1000 * 1000 * 1000 },
  ];
  export const Replicas = [
    { label: '1', value: 1 },
    { label: '3', value: 3 },
    { label: '5', value: 5 },
  ];
  export const Storage = [
    { label: '5 GB', value: 5 * 1000 * 1000 * 1000 },
    { label: '10 GB', value: 10 * 1000 * 1000 * 1000 },
    { label: '20 GB', value: 20 * 1000 * 1000 * 1000 },
  ];

  export interface Status {
    nodes?: StatusNode;
    phase: string;
  }

  export interface StatusNode {
    name: string;
    phase: string;
  }
}

export class DatabaseModel extends BaseModel {
  public _id: string;
  public cpu: number;
  public createdAt: Date;
  public get game() {
    return gameQuery.getEntity(this.gameId);
  }
  public gameId: string;
  public preemptible: boolean;
  public memory: number;
  public name: string;
  public namespaceId: string;
  public replicas: number;
  public status: IDatabase.Status;
  public storage: number;
  public updatedAt: Date;

  constructor(parameters: Partial<DatabaseModel> = {}) {
    super(parameters);
  }

  public static isRestartRequired(fields: string[]) {
    const immutableFields = ['cpu', 'memory', 'preemptible', 'replicas', 'storage'];
    return immutableFields.some(i => fields.includes(i));
  }
}
