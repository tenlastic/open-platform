import {
  DocumentType,
  getModelForClass,
  modelOptions,
  prop,
  PropType,
  ReturnModelType,
} from '@typegoose/typegoose';

import { WorkflowStatusPhase } from '../model';

export enum WorkflowStatusNodeType {
  DAG = 'DAG',
  Pod = 'Pod',
  Retry = 'Retry',
  Skipped = 'Skipped',
}

@modelOptions({ schemaOptions: { _id: false, id: false } })
export class WorkflowStatusNodeSchema {
  @prop({ type: String })
  public _id: string;

  @prop({ type: String }, PropType.ARRAY)
  public children: string[];

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

  @prop({ type: String })
  public phase: WorkflowStatusPhase;

  @prop({ type: Date })
  public startedAt: Date;

  @prop({ type: String })
  public templateName: string;

  @prop({ enum: WorkflowStatusNodeType, type: String })
  public type: WorkflowStatusNodeType;
}

export type WorkflowStatusNodeDocument = DocumentType<WorkflowStatusNodeSchema>;
export type WorkflowStatusNodeModel = ReturnModelType<typeof WorkflowStatusNodeSchema>;
export const WorkflowStatusNode = getModelForClass(WorkflowStatusNodeSchema);
