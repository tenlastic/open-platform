import {
  DocumentType,
  getModelForClass,
  index,
  modelOptions,
  plugin,
  prop,
} from '@typegoose/typegoose';
import { Chance } from 'chance';
import * as mongoose from 'mongoose';

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

@index({ name: 1 }, { collation: { locale: 'en', strength: 1 }, unique: true })
@modelOptions({ schemaOptions: { collection: 'namespaces', timestamps: true } })
@plugin(duplicateKeyErrorPlugin)
@plugin(unsetPlugin)
export class NamespaceSchema {
  public _id: mongoose.Types.ObjectId;
  public createdAt: Date;

  @prop({ default: () => new NamespaceLimitsModel(), type: NamespaceLimitsSchema, unset: false })
  public limits: NamespaceLimitsDocument;

  @prop({ maxlength: 64, required: true, trim: true, type: String })
  public name: string;

  @prop({ filter: { create: true, update: true }, type: Date })
  public restartedAt: Date;

  @prop({ default: () => new NamespaceStatusModel(), merge: true, type: NamespaceStatusSchema })
  public status: NamespaceStatusDocument;

  public updatedAt: Date;

  @prop({ foreignField: 'namespaceId', localField: '_id', ref: 'AuthorizationSchema' })
  public authorizationDocuments: AuthorizationDocument[];

  /**
   * Creates a record with randomized required parameters if not specified.
   */
  public static mock(this: typeof NamespaceModel, values: Partial<NamespaceSchema> = {}) {
    const chance = new Chance();
    const defaults = { name: chance.hash() };

    return new this({ ...defaults, ...values });
  }

  /**
   * Throws a NamespaceLimitError if the CPU limit is reached.
   */
  public checkCpuLimit(current: number, previous?: number) {
    current = current ?? 0;
    previous = previous ?? 0;

    const limit = this.limits.cpu || 0;
    const status = this.status.limits.cpu || 0;

    if (current - previous + status > limit) {
      throw new NamespaceLimitError('cpu');
    }
  }

  /**
   * Throws a NamespaceLimitError if the default authorization limit is reached.
   */
  public checkDefaultAuthorizationLimit(current: boolean) {
    if (current && !this.limits.defaultAuthorization) {
      throw new NamespaceLimitError('defaultAuthorization');
    }
  }

  /**
   * Throws a NamespaceLimitError if the memory limit is reached.
   */
  public checkMemoryLimit(current: number, previous?: number) {
    current = current ?? 0;
    previous = previous ?? 0;

    const limit = this.limits.memory || 0;
    const status = this.status.limits.memory || 0;

    if (current - previous + status > limit) {
      throw new NamespaceLimitError('memory');
    }
  }

  /**
   * Throws a NamespaceLimitError if the preemptible limit is reached.
   */
  public checkNonPreemptibleLimit(current: boolean) {
    if (!current && !this.limits.nonPreemptible) {
      throw new NamespaceLimitError('nonPreemptible');
    }
  }

  /**
   * Throws a NamespaceLimitError if the storage limit is reached.
   */
  public checkStorageLimit(current: number, previous?: number) {
    current = current ?? 0;
    previous = previous ?? 0;

    const limit = this.limits.storage || 0;
    const status = this.status.limits.storage || 0;

    if (current - previous + status > limit) {
      throw new NamespaceLimitError('storage');
    }
  }

  /**
   * Returns true if a restart is required on an update.
   */
  public static isRestartRequired(fields: string[]) {
    const immutableFields = ['limits', 'restartedAt'];

    return immutableFields.some((i) => fields.includes(i));
  }
}

export type NamespaceDocument = DocumentType<NamespaceSchema>;
export const NamespaceModel = getModelForClass(NamespaceSchema);
