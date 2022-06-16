import {
  DocumentType,
  ReturnModelType,
  getModelForClass,
  modelOptions,
  prop,
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
  @prop()
  public finishedAt: Date;

  @prop()
  public message: string;

  @prop({ type: WorkflowStatusNodeSchema })
  public nodes: WorkflowStatusNodeSchema[];

  @prop({ enum: WorkflowStatusPhase })
  public phase: WorkflowStatusPhase;

  @prop()
  public startedAt: Date;

  @prop()
  public version: string;
}

export type WorkflowStatusDocument = DocumentType<WorkflowStatusSchema>;
export type WorkflowStatusModel = ReturnModelType<typeof WorkflowStatusSchema>;
export const WorkflowStatus = getModelForClass(WorkflowStatusSchema);
