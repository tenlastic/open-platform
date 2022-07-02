import { Model } from './model';

export namespace INamespace {
  export enum Role {
    Articles = 'articles',
    Builds = 'builds',
    Databases = 'databases',
    GameServers = 'game-servers',
    Games = 'games',
    Namespaces = 'namespaces',
    Queues = 'queues',
    Workflows = 'workflows',
  }

  export interface Key {
    description: string;
    roles: string[];
    value: string;
  }

  export interface Limits {
    cpu: number;
    memory: number;
    preemptible: boolean;
    storage: number;
  }

  export interface Resource {
    cpu: number;
    memory: number;
    preemptible: boolean;
    replicas: number;
    storage: number;
  }

  export interface Resources {
    minio: Resource;
    mongodb: Resource;
    nats: Resource;
  }

  export interface Status {
    components?: StatusComponent[];
    nodes?: StatusNode[];
    phase: string;
    version?: string;
  }

  export interface StatusComponent {
    name: string;
    phase: string;
    replicas: { current: number; total: number };
  }

  export interface StatusNode {
    _id: string;
    displayName: string;
    phase: string;
  }

  export interface User {
    _id: string;
    roles: string[];
  }
}

export class Namespace extends Model {
  public keys: INamespace.Key[];
  public limits: INamespace.Limits;
  public name: string;
  public resources: INamespace.Resources;
  public restartedAt: Date;
  public status: INamespace.Status;
  public users: INamespace.User[];

  constructor(params?: Partial<Namespace>) {
    super(params);
  }

  public static isRestartRequired(fields: string[]) {
    const immutableFields = ['resources', 'restartedAt'];
    return immutableFields.some((i) => fields.includes(i));
  }
}
