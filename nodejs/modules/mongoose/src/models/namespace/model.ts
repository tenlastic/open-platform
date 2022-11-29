import {
  DocumentType,
  getModelForClass,
  index,
  modelOptions,
  plugin,
  prop,
  ReturnModelType,
} from '@typegoose/typegoose';
import { Chance } from 'chance';
import * as mongoose from 'mongoose';

import { duplicateKeyErrorPlugin } from '../../plugins';
import { AuthorizationDocument } from '../authorization';
import { NamespaceLimits, NamespaceLimitsDocument, NamespaceLimitsSchema } from './limits';
import {
  NamespaceStatus,
  NamespaceStatusComponent,
  NamespaceStatusComponentName,
  NamespaceStatusPhase,
  NamespaceStatusSchema,
} from './status';

export class NamespaceLimitError extends Error {
  public path: string;

  constructor(path: string) {
    super(`Namespace limit reached: ${path}.`);

    this.name = 'NamespaceLimitError';
    this.path = path;
  }
}

@index({ name: 1 }, { unique: true })
@modelOptions({
  schemaOptions: { collection: 'namespaces', minimize: false, timestamps: true },
})
@plugin(duplicateKeyErrorPlugin)
export class NamespaceSchema {
  public _id: mongoose.Types.ObjectId;
  public createdAt: Date;

  @prop({ default: new NamespaceLimits(), type: NamespaceLimitsSchema })
  public limits: NamespaceLimitsDocument;

  @prop({ required: true, type: String })
  public name: string;

  @prop({
    default(this: NamespaceDocument) {
      return new NamespaceStatus({
        components: [
          new NamespaceStatusComponent({
            current: 0,
            name: NamespaceStatusComponentName.API,
            phase: NamespaceStatusPhase.Pending,
            total: 1,
          }),
          new NamespaceStatusComponent({
            current: 0,
            name: NamespaceStatusComponentName.CDC,
            phase: NamespaceStatusPhase.Pending,
            total: 1,
          }),
          new NamespaceStatusComponent({
            current: 0,
            name: NamespaceStatusComponentName.Connector,
            phase: NamespaceStatusPhase.Pending,
            total: 1,
          }),
          new NamespaceStatusComponent({
            current: 0,
            name: NamespaceStatusComponentName.Metrics,
            phase: NamespaceStatusPhase.Pending,
            total: 1,
          }),
          new NamespaceStatusComponent({
            current: 0,
            name: NamespaceStatusComponentName.Sidecar,
            phase: NamespaceStatusPhase.Pending,
            total: 1,
          }),
        ],
      });
    },
    merge: true,
    type: NamespaceStatusSchema,
  })
  public status: NamespaceStatusSchema;

  public updatedAt: Date;

  @prop({ foreignField: 'namespaceId', localField: '_id', ref: 'AuthorizationSchema' })
  public authorizationDocuments: AuthorizationDocument[];

  /**
   * Creates a record with randomized required parameters if not specified.
   */
  public static mock(this: NamespaceModel, values: Partial<NamespaceSchema> = {}) {
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

    const limit = this.limits?.cpu || 0;
    const status = this.status?.limits?.cpu || 0;

    if (current - previous + status > limit) {
      throw new NamespaceLimitError('cpu');
    }
  }

  /**
   * Throws a NamespaceLimitError if the default authorization limit is reached.
   */
  public checkDefaultAuthorizationLimit(current: boolean) {
    if (current && !this.limits?.defaultAuthorization) {
      throw new NamespaceLimitError('defaultAuthorization');
    }
  }

  /**
   * Throws a NamespaceLimitError if the memory limit is reached.
   */
  public checkMemoryLimit(current: number, previous?: number) {
    current = current ?? 0;
    previous = previous ?? 0;

    const limit = this.limits?.memory || 0;
    const status = this.status?.limits?.memory || 0;

    if (current - previous + status > limit) {
      throw new NamespaceLimitError('memory');
    }
  }

  /**
   * Throws a NamespaceLimitError if the preemptible limit is reached.
   */
  public checkPreemptibleLimit(current: boolean) {
    if (!current && this.limits?.preemptible) {
      throw new NamespaceLimitError('preemptible');
    }
  }

  /**
   * Throws a NamespaceLimitError if the storage limit is reached.
   */
  public checkStorageLimit(current: number, previous?: number) {
    current = current ?? 0;
    previous = previous ?? 0;

    const limit = this.limits?.storage || 0;
    const status = this.status?.limits?.storage || 0;

    if (current - previous + status > limit) {
      throw new NamespaceLimitError('storage');
    }
  }

  /**
   * Returns a NamespaceLimitError if one is reached.
   */
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
}

export type NamespaceDocument = DocumentType<NamespaceSchema>;
export type NamespaceModel = ReturnModelType<typeof NamespaceSchema>;
export const Namespace = getModelForClass(NamespaceSchema);
