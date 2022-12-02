import { DocumentType, getModelForClass, modelOptions, prop, PropType } from '@typegoose/typegoose';

import { WorkflowStatusNodeDocument, WorkflowStatusNodeSchema } from './node';

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
  public nodes: WorkflowStatusNodeDocument[];

  @prop({ default: () => WorkflowStatusPhase.Pending, enum: WorkflowStatusPhase, type: String })
  public phase: WorkflowStatusPhase;

  @prop({ type: Date })
  public startedAt: Date;

  @prop({ type: String })
  public version: string;

  /**
   * Creates a record with randomized required parameters if not specified.
   */
  public static mock(this: typeof WorkflowStatusModel, values: Partial<WorkflowStatusSchema> = {}) {
    const defaults = {};

    return new this({ ...defaults, ...values });
  }
}

export type WorkflowStatusDocument = DocumentType<WorkflowStatusSchema>;
export const WorkflowStatusModel = getModelForClass(WorkflowStatusSchema);
