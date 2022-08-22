import {
  DocumentType,
  ReturnModelType,
  getModelForClass,
  index,
  modelOptions,
  plugin,
  prop,
} from '@typegoose/typegoose';
import * as mongoose from 'mongoose';

import { changeStreamPlugin, EventEmitter, IDatabasePayload } from '../../change-stream';
import { Namespace, NamespaceDocument, NamespaceLimitError } from '../namespace';
import { WorkflowSpecSchema } from './spec';
import { WorkflowStatusSchema } from './status';

export const OnWorkflowProduced = new EventEmitter<IDatabasePayload<WorkflowDocument>>();

@index({ namespaceId: 1 })
@modelOptions({ schemaOptions: { collection: 'workflows', minimize: false, timestamps: true } })
@plugin(changeStreamPlugin, { documentKeys: ['_id'], eventEmitter: OnWorkflowProduced })
export class WorkflowSchema {
  public _id: mongoose.Types.ObjectId;

  @prop({ min: 0, required: true })
  public cpu: number;

  public createdAt: Date;

  @prop({ min: 0, required: true })
  public memory: number;

  @prop({ immutable: true, required: true })
  public name: string;

  @prop({ immutable: true, ref: 'NamespaceSchema', required: true })
  public namespaceId: mongoose.Types.ObjectId;

  @prop({ immutable: true })
  public preemptible: boolean;

  @prop({ immutable: true, required: true })
  public spec: WorkflowSpecSchema;

  @prop()
  public status: WorkflowStatusSchema;

  @prop({ min: 0, required: true })
  public storage: number;

  public updatedAt: Date;

  @prop({ foreignField: '_id', justOne: true, localField: 'namespaceId', ref: 'NamespaceSchema' })
  public namespaceDocument: NamespaceDocument;

  public _original: any;
  public wasModified: string[];
  public wasNew: boolean;

  /**
   * Throws an error if a NamespaceLimit is exceeded.
   */
  public static async checkNamespaceLimits(
    cpu: number,
    memory: number,
    namespaceId: string | mongoose.Types.ObjectId,
    parallelism: number,
    preemptible: boolean,
    storage: number,
  ) {
    const namespace = await Namespace.findOne({ _id: namespaceId });
    if (!namespace) {
      throw new Error('Record not found.');
    }

    const limits = namespace.limits.workflows;

    // CPU.
    if (limits.cpu && cpu > limits.cpu) {
      throw new NamespaceLimitError('workflows.cpu', limits.cpu);
    }

    // Memory.
    if (limits.memory && memory > limits.memory) {
      throw new NamespaceLimitError('workflows.memory', limits.memory);
    }

    // Parallelism.
    if (limits.parallelism && parallelism > limits.parallelism) {
      throw new NamespaceLimitError('workflows.parallelism', limits.parallelism);
    }

    // Preemptible.
    if (limits.preemptible && preemptible === false) {
      throw new NamespaceLimitError('workflows.preemptible', limits.preemptible);
    }

    // Storage.
    if (limits.storage && storage > limits.storage) {
      throw new NamespaceLimitError('workflows.storage', limits.storage);
    }
  }
}

export type WorkflowDocument = DocumentType<WorkflowSchema>;
export type WorkflowModel = ReturnModelType<typeof WorkflowSchema>;
export const Workflow = getModelForClass(WorkflowSchema);
