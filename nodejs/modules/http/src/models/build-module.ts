import { ModuleModel } from './module';

export namespace IBuildModuleModel {
  export interface Minio {
    cpu?: number;
    memory?: number;
    preemptible?: boolean;
    replicas?: number;
    storage?: number;
  }

  export interface Resources {
    minio?: Minio;
  }

  export interface Status {
    components?: StatusComponent[];
    nodes?: StatusNode[];
    phase: string;
  }

  export interface StatusComponent {
    name: string;
    phase: string;
    replicas: number;
  }

  export interface StatusNode {
    _id: string;
    phase: string;
  }
}

export class BuildModuleModel extends ModuleModel {
  public static readonly discriminatorValue = 'build';

  public limits?: IBuildModuleModel.Resources;
  public resources?: IBuildModuleModel.Resources;
  public status?: IBuildModuleModel.Status;

  constructor(parameters: Partial<BuildModuleModel> = {}) {
    super(parameters);
  }
}
