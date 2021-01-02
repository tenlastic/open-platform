import {
  DocumentType,
  ReturnModelType,
  arrayProp,
  getModelForClass,
  modelOptions,
  prop,
} from '@hasezoey/typegoose';

import { WorkflowStatusPhase } from '../model';

export enum WorkflowStatusNodeType {
  DAG = 'DAG',
  Pod = 'Pod',
  Retry = 'Retry',
}

@modelOptions({ schemaOptions: { _id: false, id: false } })
export class WorkflowStatusNodeSchema {
  @arrayProp({ items: String })
  public children: string[];

  @prop()
  public displayName: string;

  @prop()
  public finishedAt: Date;

  @prop()
  public id: string;

  @prop()
  public message: string;

  @prop()
  public name: string;

  @arrayProp({ items: String })
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
