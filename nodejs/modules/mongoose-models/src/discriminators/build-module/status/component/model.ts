import {
  DocumentType,
  ReturnModelType,
  getModelForClass,
  modelOptions,
  prop,
} from '@typegoose/typegoose';

import { Phase } from '../model';

export enum ComponentName {
  Api = 'api',
  DockerRegistry = 'docker-registry',
  Minio = 'minio',
  Sidecar = 'sidecar',
  WorkflowController = 'workflow-controller',
}

@modelOptions({ schemaOptions: { _id: false } })
export class ComponentSchema {
  @prop({ enum: ComponentName, required: true })
  public name: ComponentName;

  @prop({ enum: Phase, required: true })
  public phase: Phase;

  @prop({ default: 0 })
  public replicas: number;
}

export type ComponentDocument = DocumentType<ComponentSchema>;
export type ComponentModel = ReturnModelType<typeof ComponentSchema>;
export const Component = getModelForClass(ComponentSchema);
