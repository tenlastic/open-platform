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
    limits?: StatusLimit[];
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

  export interface StatusLimit {
    current: number;
    name: string;
    total: number;
  }

  export interface StatusNode {
    _id: string;
    displayName?: string;
    phase: string;
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
