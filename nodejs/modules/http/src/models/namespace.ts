import { BaseModel } from './base';

export namespace INamespace {
  export enum StatusComponentName {
    API = 'API',
    CDC = 'CDC',
    Connector = 'Connector',
    Metrics = 'Metrics',
    Migrations = 'Migrations',
    Sidecar = 'Sidecar',
  }

  export interface Limits {
    bandwidth?: number;
    cpu?: number;
    defaultAuthorization?: boolean;
    memory?: number;
    nonPreemptible?: boolean;
    storage?: number;
  }

  export interface Status {
    components?: StatusComponent[];
    limits?: StatusLimits;
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

  export interface StatusLimits {
    bandwidth?: number;
    cpu?: number;
    memory?: number;
    storage?: number;
  }

  export interface StatusNode {
    component: StatusComponentName;
    container: string;
    phase: string;
    pod: string;
  }
}

export class NamespaceModel extends BaseModel {
  public limits: INamespace.Limits;
  public name: string;
  public status: INamespace.Status;

  constructor(parameters?: Partial<NamespaceModel>) {
    super(parameters);
  }

  public static isRestartRequired(fields: string[]) {
    const immutableFields = ['limits', 'restartedAt'];

    return immutableFields.some((i) => fields.includes(i));
  }
}
