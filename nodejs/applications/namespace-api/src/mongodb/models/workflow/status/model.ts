import {
  DocumentType,
  getModelForClass,
  modelOptions,
  prop,
  PropType,
  ReturnModelType,
} from '@typegoose/typegoose';

import { WorkflowStatusNodeSchema } from './node';

export enum WorkflowStatusPhase {
  Error = 'Error',
  Failed = 'Failed',
  Pending = 'Pending',
  Running = 'Running',
  Succeeded = 'Succeeded',
}

@modelOptions({ schemaOptions: { _id: false } })
export class WorkflowStatusSchema {
  @prop({ type: Date })
  public finishedAt: Date;

  @prop({ type: String })
  public message: string;

  @prop({ type: WorkflowStatusNodeSchema }, PropType.ARRAY)
  public nodes: WorkflowStatusNodeSchema[];

  @prop({ enum: WorkflowStatusPhase, type: String })
  public phase: WorkflowStatusPhase;

  @prop({ type: Date })
  public startedAt: Date;

  @prop({ type: String })
  public version: string;
}

export type WorkflowStatusDocument = DocumentType<WorkflowStatusSchema>;
export type WorkflowStatusModel = ReturnModelType<typeof WorkflowStatusSchema>;
export const WorkflowStatus = getModelForClass(WorkflowStatusSchema);
