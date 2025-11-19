import { Chance } from 'chance';
import * as mongoose from 'mongoose';

import { unsetPlugin } from '../../plugins';
import { AuthorizationDocument } from '../authorization';
import { WorkflowSpecDocument, WorkflowSpecModel, WorkflowSpecSchema } from './spec';
import { WorkflowStatusDocument, WorkflowStatusModel, WorkflowStatusSchema } from './status';

export interface Workflow {
  _id: mongoose.Types.ObjectId;
  authorizationDocuments?: AuthorizationDocument[];
  cpu: number;
  createdAt?: Date;
  memory: number;
  name: string;
  namespaceId: mongoose.Types.ObjectId;
  preemptible?: boolean;
  spec: WorkflowSpecDocument;
  status?: WorkflowStatusDocument;
  storage: number;
  updatedAt?: Date;
}

export interface WorkflowDocument extends mongoose.Document<mongoose.Types.ObjectId>, Workflow {}

export interface WorkflowModelType extends mongoose.Model<WorkflowDocument> {
  /**
   * Creates a record with randomized required parameters if not specified.
   */
  mock(this: WorkflowModelType, values?: Partial<Workflow>): WorkflowDocument;
}

export const WorkflowSchema = new mongoose.Schema<WorkflowDocument>(
  {
    cpu: { min: 0, required: true, type: Number },
    memory: { min: 0, required: true, type: Number },
    name: { maxlength: 64, required: true, trim: true, type: String },
    namespaceId: { ref: 'NamespaceSchema', required: true, type: mongoose.Schema.Types.ObjectId },
    preemptible: { type: Boolean },
    spec: { required: true, type: WorkflowSpecSchema },
    status: { merge: true, type: WorkflowStatusSchema, default: () => new WorkflowStatusModel() },
    storage: { min: 0, required: true, type: Number },
  },
  { collection: 'workflows', minimize: false, timestamps: true },
);

WorkflowSchema.index({ namespaceId: 1 });

WorkflowSchema.plugin(unsetPlugin);

WorkflowSchema.virtual('authorizationDocuments', {
  foreignField: 'namespaceId',
  localField: 'namespaceId',
  ref: 'AuthorizationSchema',
});

WorkflowSchema.statics.mock = function (this: WorkflowModelType, values: Partial<Workflow> = {}) {
  const chance = new Chance();
  const defaults = {
    cpu: chance.pickone([1, 3, 5]),
    memory: chance.pickone([1, 3, 5]),
    name: chance.hash(),
    namespaceId: new mongoose.Types.ObjectId(),
    spec: WorkflowSpecModel.mock(),
    storage: chance.pickone([1, 3, 5]),
  } as Partial<Workflow>;

  return new this({ ...defaults, ...values });
};

export const WorkflowModel = mongoose.model<WorkflowDocument, WorkflowModelType>(
  'Workflow',
  WorkflowSchema,
);
