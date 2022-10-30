import {
  DocumentType,
  getModelForClass,
  index,
  modelOptions,
  prop,
  ReturnModelType,
} from '@typegoose/typegoose';
import * as mongoose from 'mongoose';

import { AuthorizationDocument } from '../authorization/model';
import { NamespaceLimitsSchema } from './limits';
import { NamespaceStatusSchema } from './status';

export class NamespaceLimitError extends Error {
  public path: string;

  constructor(path: string) {
    super(`Namespace limit reached: ${path}.`);

    this.name = 'NamespaceLimitError';
    this.path = path;
  }
}

@index({ name: 1 })
@modelOptions({ schemaOptions: { collection: 'namespaces', minimize: false, timestamps: true } })
export class NamespaceSchema {
  public _id: mongoose.Types.ObjectId;
  public createdAt: Date;
  public updatedAt: Date;

  @prop({ type: NamespaceLimitsSchema })
  public limits: NamespaceLimitsSchema;

  @prop({ type: NamespaceStatusSchema })
  public status: NamespaceStatusSchema;

  @prop({ foreignField: 'namespaceId', localField: '_id', ref: 'AuthorizationSchema' })
  public authorizationDocuments: AuthorizationDocument[];

  public getLimitError(
    current: Partial<NamespaceLimitsSchema>,
    previous?: Partial<NamespaceLimitsSchema>,
  ) {
    current = { cpu: current.cpu || 0, memory: current.memory || 0 };
    previous = { cpu: previous.cpu || 0, memory: previous.memory || 0 };

    const limits = { cpu: this.limits?.cpu || 0, memory: this.limits?.memory || 0 };
    const status = { cpu: this.status?.limits?.cpu || 0, memory: this.status?.limits?.memory || 0 };

    if (current.cpu - previous.cpu + status.cpu > limits.cpu) {
      return new NamespaceLimitError('cpu');
    }
    if (current.memory - previous.memory + status.memory > limits.memory) {
      return new NamespaceLimitError('memory');
    }
    if (!current.preemptible && this.limits?.preemptible) {
      return new NamespaceLimitError('preemptible');
    }
  }

  public checkCpuLimit(current: number, previous?: number) {
    current = current ?? 0;
    previous = previous ?? 0;

    const limit = this.limits?.cpu || 0;
    const status = this.status?.limits?.cpu || 0;

    if (current - previous + status > limit) {
      throw new NamespaceLimitError('cpu');
    }
  }

  public checkMemoryLimit(current: number, previous?: number) {
    current = current ?? 0;
    previous = previous ?? 0;

    const limit = this.limits?.memory || 0;
    const status = this.status?.limits?.memory || 0;

    if (current - previous + status > limit) {
      throw new NamespaceLimitError('memory');
    }
  }

  public checkPreemptibleLimit(current: boolean) {
    if (!current && this.limits?.preemptible) {
      throw new NamespaceLimitError('preemptible');
    }
  }

  public checkStorageLimit(current: number, previous?: number) {
    current = current ?? 0;
    previous = previous ?? 0;

    const limit = this.limits?.storage || 0;
    const status = this.status?.limits?.storage || 0;

    if (current - previous + status > limit) {
      throw new NamespaceLimitError('storage');
    }
  }
}

export type NamespaceDocument = DocumentType<NamespaceSchema>;
export type NamespaceModel = ReturnModelType<typeof NamespaceSchema>;
export const Namespace = getModelForClass(NamespaceSchema);
