import { Chance } from 'chance';
import * as mongoose from 'mongoose';

import { collation } from '../../constants';
import { duplicateKeyErrorPlugin, unsetPlugin } from '../../plugins';
import { AuthorizationDocument } from '../authorization';
import { NamespaceLimitsDocument, NamespaceLimitsModel, NamespaceLimitsSchema } from './limits';
import { NamespaceStatusDocument, NamespaceStatusModel, NamespaceStatusSchema } from './status';

export class NamespaceLimitError extends Error {
  public path: string;

  constructor(path: string) {
    super(`Namespace limit reached: ${path}.`);

    this.name = 'NamespaceLimitError';
    this.path = path;
  }
}

export interface Namespace {
  _id: mongoose.Types.ObjectId;
  authorizationDocuments?: AuthorizationDocument[];
  createdAt?: Date;
  limits: NamespaceLimitsDocument;
  name: string;
  restartedAt?: Date;
  status: NamespaceStatusDocument;
  updatedAt?: Date;
}

export interface NamespaceDocument extends mongoose.Document<mongoose.Types.ObjectId>, Namespace {
  /**
   * Throws a NamespaceLimitError if the CPU limit is reached.
   */
  checkCpuLimit(this: NamespaceDocument, current: number, previous?: number): void;

  /**
   * Throws a NamespaceLimitError if the default authorization limit is reached.
   */
  checkDefaultAuthorizationLimit(this: NamespaceDocument, current: boolean): void;

  /**
   * Throws a NamespaceLimitError if the memory limit is reached.
   */
  checkMemoryLimit(this: NamespaceDocument, current: number, previous?: number): void;

  /**
   * Throws a NamespaceLimitError if the preemptible limit is reached.
   */
  checkNonPreemptibleLimit(this: NamespaceDocument, current: boolean): void;

  /**
   * Throws a NamespaceLimitError if the storage limit is reached.
   */
  checkStorageLimit(this: NamespaceDocument, current: number, previous?: number): void;
}

export interface NamespaceModelType extends mongoose.Model<NamespaceDocument> {
  /**
   * Returns true if a restart is required on an update.
   */
  isRestartRequired(fields: string[]): boolean;

  /**
   * Creates a record with randomized required parameters if not specified.
   */
  mock(this: NamespaceModelType, values?: Partial<Namespace>): NamespaceDocument;
}

const NamespaceSchema = new mongoose.Schema<NamespaceDocument, NamespaceModelType>(
  {
    limits: {
      default: () => new NamespaceLimitsModel(),
      type: NamespaceLimitsSchema,
      unset: false,
    },
    name: { maxlength: 64, required: true, trim: true, type: String },
    restartedAt: { type: Date },
    status: { default: () => new NamespaceStatusModel(), merge: true, type: NamespaceStatusSchema },
  },
  { collation, collection: 'namespaces', timestamps: true },
);

NamespaceSchema.index({ name: 1 }, { collation, unique: true });

NamespaceSchema.plugin(duplicateKeyErrorPlugin);
NamespaceSchema.plugin(unsetPlugin);

NamespaceSchema.virtual('authorizationDocuments', {
  ref: 'AuthorizationSchema',
  localField: '_id',
  foreignField: 'namespaceId',
});

NamespaceSchema.statics.isRestartRequired = function (fields: string[]) {
  const immutableFields = ['limits', 'restartedAt'];

  return immutableFields.some((i) => fields.includes(i));
};

NamespaceSchema.statics.mock = function (values: Partial<Namespace> = {}) {
  const chance = new Chance();
  const defaults: Partial<Namespace> = { name: chance.hash() };

  return new this({ ...defaults, ...values });
};

NamespaceSchema.methods.checkCpuLimit = function (
  this: NamespaceDocument,
  current: number,
  previous?: number,
) {
  current = current ?? 0;
  previous = previous ?? 0;

  const limit = this.limits.cpu || 0;
  const status = this.status.limits.cpu || 0;

  if (current - previous + status > limit) {
    throw new NamespaceLimitError('cpu');
  }
};

NamespaceSchema.methods.checkDefaultAuthorizationLimit = function (
  this: NamespaceDocument,
  current: boolean,
) {
  if (current && !this.limits.defaultAuthorization) {
    throw new NamespaceLimitError('defaultAuthorization');
  }
};

NamespaceSchema.methods.checkMemoryLimit = function (
  this: NamespaceDocument,
  current: number,
  previous?: number,
) {
  current = current ?? 0;
  previous = previous ?? 0;

  const limit = this.limits.memory || 0;
  const status = this.status.limits.memory || 0;

  if (current - previous + status > limit) {
    throw new NamespaceLimitError('memory');
  }
};

NamespaceSchema.methods.checkNonPreemptibleLimit = function (
  this: NamespaceDocument,
  current: boolean,
) {
  if (!current && !this.limits.nonPreemptible) {
    throw new NamespaceLimitError('nonPreemptible');
  }
};

NamespaceSchema.methods.checkStorageLimit = function (
  this: NamespaceDocument,
  current: number,
  previous?: number,
) {
  current = current ?? 0;
  previous = previous ?? 0;

  const limit = this.limits.storage || 0;
  const status = this.status.limits.storage || 0;

  if (current - previous + status > limit) {
    throw new NamespaceLimitError('storage');
  }
};

export const NamespaceModel = mongoose.model<NamespaceDocument, NamespaceModelType>(
  'NamespaceSchema',
  NamespaceSchema,
);

export { NamespaceSchema };

export default NamespaceModel;
