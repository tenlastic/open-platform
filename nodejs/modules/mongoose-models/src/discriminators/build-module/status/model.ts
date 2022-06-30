import {
  DocumentType,
  getModelForClass,
  modelOptions,
  prop,
  ReturnModelType,
} from '@typegoose/typegoose';

import { ComponentSchema } from './component';
import { NodeSchema } from './node';

export enum Phase {
  Error = 'Error',
  Failed = 'Failed',
  Pending = 'Pending',
  Running = 'Running',
  Succeeded = 'Succeeded',
}

@modelOptions({ schemaOptions: { _id: false } })
export class StatusSchema {
  @prop({ type: ComponentSchema })
  public components: ComponentSchema[];

  @prop({ type: NodeSchema })
  public nodes: NodeSchema[];

  @prop({ enum: Phase, required: true })
  public phase: Phase;

  @prop()
  public version: string;
}

export type StatusSchemaDocument = DocumentType<StatusSchema>;
export type StatusSchemaModel = ReturnModelType<typeof StatusSchema>;
export const Status = getModelForClass(StatusSchema);
