import {
  DocumentType,
  ReturnModelType,
  arrayProp,
  getModelForClass,
  modelOptions,
  prop,
} from '@hasezoey/typegoose';

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

  @arrayProp({ items: WorkflowStatusNodeSchema })
  public nodes: WorkflowStatusNodeSchema[];

  @prop({ enum: WorkflowStatusPhase })
  public phase: WorkflowStatusPhase;

  @prop()
  public startedAt: Date;
}

export type WorkflowStatusDocument = DocumentType<WorkflowStatusSchema>;
export type WorkflowStatusModel = ReturnModelType<typeof WorkflowStatusSchema>;
export const WorkflowStatus = getModelForClass(WorkflowStatusSchema);
