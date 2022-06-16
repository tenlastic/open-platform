import {
  DocumentType,
  ReturnModelType,
  getModelForClass,
  modelOptions,
  prop,
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
  @prop()
  public _id: string;

  @prop({ type: String })
  public children: string[];

  @prop()
  public displayName: string;

  @prop()
  public finishedAt: Date;

  @prop()
  public logs: boolean;

  @prop()
  public message: string;

  @prop()
  public name: string;

  @prop({ type: String })
  public outboundNodes: string[];

  @prop()
  public phase: WorkflowStatusPhase;

  @prop()
  public startedAt: Date;

  @prop()
  public templateName: string;

  @prop({ enum: WorkflowStatusNodeType })
  public type: WorkflowStatusNodeType;
}

export type WorkflowStatusNodeDocument = DocumentType<WorkflowStatusNodeSchema>;
export type WorkflowStatusNodeModel = ReturnModelType<typeof WorkflowStatusNodeSchema>;
export const WorkflowStatusNode = getModelForClass(WorkflowStatusNodeSchema);
