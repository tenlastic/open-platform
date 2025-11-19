import * as mongoose from 'mongoose';

import { WorkflowStatusPhase } from '../model';

export enum WorkflowStatusNodeType {
  DAG = 'DAG',
  Pod = 'Pod',
  Retry = 'Retry',
  Skipped = 'Skipped',
}

export interface WorkflowStatusNode {
  children?: string[];
  container?: string;
  displayName?: string;
  finishedAt?: Date;
  id?: string;
  logs?: boolean;
  message?: string;
  name?: string;
  outboundNodes?: string[];
  phase?: WorkflowStatusPhase;
  pod?: string;
  startedAt?: Date;
  templateName?: string;
  type?: WorkflowStatusNodeType;
}

export interface WorkflowStatusNodeDocument
  extends Omit<mongoose.Document, 'id'>,
    WorkflowStatusNode {}

export interface WorkflowStatusNodeModelType extends mongoose.Model<WorkflowStatusNodeDocument> {
  /**
   * Creates a record with randomized required parameters if not specified.
   */
  mock(
    this: WorkflowStatusNodeModelType,
    values?: Partial<WorkflowStatusNode>,
  ): WorkflowStatusNodeDocument;
}

export const WorkflowStatusNodeSchema = new mongoose.Schema<WorkflowStatusNodeDocument>(
  {
    children: { type: [String] },
    container: { type: String },
    displayName: { type: String },
    finishedAt: { type: Date },
    id: { type: String },
    logs: { type: Boolean },
    message: { type: String },
    name: { type: String },
    outboundNodes: { type: [String] },
    phase: {
      default: WorkflowStatusPhase.Pending,
      enum: Object.values(WorkflowStatusPhase),
      type: String,
    },
    pod: { type: String },
    startedAt: { type: Date },
    templateName: { type: String },
    type: { enum: Object.values(WorkflowStatusNodeType), type: String },
  },
  { _id: false },
);

WorkflowStatusNodeSchema.statics.mock = function (
  this: WorkflowStatusNodeModelType,
  values: Partial<WorkflowStatusNode> = {},
) {
  const defaults = {};

  return new this({ ...defaults, ...values });
};

export const WorkflowStatusNodeModel = mongoose.model<
  WorkflowStatusNodeDocument,
  WorkflowStatusNodeModelType
>('WorkflowStatusNode', WorkflowStatusNodeSchema);
