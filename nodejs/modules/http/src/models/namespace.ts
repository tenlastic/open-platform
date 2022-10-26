import { BaseModel } from './base';

export namespace INamespace {
  export interface Limits {
    bandwidth?: number;
    cpu?: number;
    memory?: number;
    preemptible?: boolean;
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
    name: string;
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
    component: string;
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
}
