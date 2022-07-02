import {
  DocumentType,
  ReturnModelType,
  getModelForClass,
  modelOptions,
  prop,
} from '@typegoose/typegoose';

import { Phase } from '../model';
import { CurrentTotal, CurrentTotalSchema } from './current-total';

export enum ComponentName {
  Api = 'api',
  DockerRegistry = 'docker-registry',
  Minio = 'minio',
  Mongodb = 'mongodb',
  Nats = 'nats',
  Provisioner = 'provisioner',
  Sidecar = 'sidecar',
  WorkflowController = 'workflow-controller',
  Wss = 'wss',
}

@modelOptions({ schemaOptions: { _id: false } })
export class ComponentSchema {
  @prop({ enum: ComponentName, required: true })
  public name: ComponentName;

  @prop({ enum: Phase, required: true })
  public phase: Phase;

  @prop({ default: () => new CurrentTotal() })
  public replicas: CurrentTotalSchema;
}

export type ComponentDocument = DocumentType<ComponentSchema>;
export type ComponentModel = ReturnModelType<typeof ComponentSchema>;
export const Component = getModelForClass(ComponentSchema);
