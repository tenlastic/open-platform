import * as mongoose from 'mongoose';

import { WorkflowStatusNodeDocument, WorkflowStatusNodeSchema } from './node';

export enum WorkflowStatusPhase {
  Error = 'Error',
  Failed = 'Failed',
  Pending = 'Pending',
  Running = 'Running',
  Succeeded = 'Succeeded',
}

export interface WorkflowStatus {
  finishedAt?: Date;
  message?: string;
  nodes?: WorkflowStatusNodeDocument[];
  phase?: WorkflowStatusPhase;
  startedAt?: Date;
  version?: string;
}

export interface WorkflowStatusDocument
  extends mongoose.Document<mongoose.Types.ObjectId>,
    WorkflowStatus {}

export interface WorkflowStatusModelType extends mongoose.Model<WorkflowStatusDocument> {
  /**
   * Creates a record with randomized required parameters if not specified.
   */
  mock(this: WorkflowStatusModelType, values?: Partial<WorkflowStatus>): WorkflowStatusDocument;
}

export const WorkflowStatusSchema = new mongoose.Schema<WorkflowStatusDocument>(
  {
    finishedAt: { type: Date },
    message: { type: String },
    nodes: { type: [WorkflowStatusNodeSchema] },
    phase: {
      default: WorkflowStatusPhase.Pending,
      enum: Object.values(WorkflowStatusPhase),
      type: String,
    },
    startedAt: { type: Date },
    version: { type: String },
  },
  { _id: false },
);

WorkflowStatusSchema.statics.mock = function (
  this: WorkflowStatusModelType,
  values: Partial<WorkflowStatus> = {},
) {
  const defaults = {};

  return new this({ ...defaults, ...values });
};

export const WorkflowStatusModel = mongoose.model<WorkflowStatusDocument, WorkflowStatusModelType>(
  'WorkflowStatus',
  WorkflowStatusSchema,
);
