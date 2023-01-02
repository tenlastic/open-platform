import { DocumentType, getModelForClass, modelOptions, prop, PropType } from '@typegoose/typegoose';

import { WorkflowStatusPhase } from '../model';

export enum WorkflowStatusNodeType {
  DAG = 'DAG',
  Pod = 'Pod',
  Retry = 'Retry',
  Skipped = 'Skipped',
}

@modelOptions({ schemaOptions: { _id: false } })
export class WorkflowStatusNodeSchema {
  @prop({ type: String }, PropType.ARRAY)
  public children: string[];

  @prop({ type: String })
  public container: string;

  @prop({ type: String })
  public displayName: string;

  @prop({ type: Date })
  public finishedAt: Date;

  @prop({ type: String })
  public id: string;

  @prop({ type: Boolean })
  public logs: boolean;

  @prop({ type: String })
  public message: string;

  @prop({ type: String })
  public name: string;

  @prop({ type: String }, PropType.ARRAY)
  public outboundNodes: string[];

  @prop({ default: () => WorkflowStatusPhase.Pending, enum: WorkflowStatusPhase, type: String })
  public phase: WorkflowStatusPhase;

  @prop({ type: String })
  public pod: string;

  @prop({ type: Date })
  public startedAt: Date;

  @prop({ type: String })
  public templateName: string;

  @prop({ enum: WorkflowStatusNodeType, type: String })
  public type: WorkflowStatusNodeType;

  /**
   * Creates a record with randomized required parameters if not specified.
   */
  public static mock(
    this: typeof WorkflowStatusNodeModel,
    values: Partial<WorkflowStatusNodeSchema> = {},
  ) {
    const defaults = {};

    return new this({ ...defaults, ...values });
  }
}

export type WorkflowStatusNodeDocument = DocumentType<WorkflowStatusNodeSchema>;
export const WorkflowStatusNodeModel = getModelForClass(WorkflowStatusNodeSchema);
