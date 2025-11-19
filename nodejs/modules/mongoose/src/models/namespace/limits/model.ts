import * as mongoose from 'mongoose';

export interface NamespaceLimits {
  bandwidth?: number;
  cpu?: number;
  defaultAuthorization?: boolean;
  memory?: number;
  nonPreemptible?: boolean;
  storage?: number;
}

export type NamespaceLimitsDocument = mongoose.Document<mongoose.Types.ObjectId> & NamespaceLimits;

export interface NamespaceLimitsModelType extends mongoose.Model<NamespaceLimitsDocument> {
  /**
   * Creates a record with randomized required parameters if not specified.
   */
  mock(this: NamespaceLimitsModelType, values?: Partial<NamespaceLimits>): NamespaceLimitsDocument;
}

const NamespaceLimitsSchema = new mongoose.Schema<
  NamespaceLimitsDocument,
  NamespaceLimitsModelType
>(
  {
    bandwidth: { default: 0, type: Number },
    cpu: { default: 0, type: Number },
    defaultAuthorization: { default: false, type: Boolean },
    memory: { default: 0, type: Number },
    nonPreemptible: { default: false, type: Boolean },
    storage: { default: 0, type: Number },
  },
  { _id: false },
);

NamespaceLimitsSchema.statics.mock = function (values: Partial<NamespaceLimits> = {}) {
  const defaults: Partial<NamespaceLimits> = { defaultAuthorization: true, nonPreemptible: true };

  return new this({ ...defaults, ...values });
};

export const NamespaceLimitsModel = mongoose.model<
  NamespaceLimitsDocument,
  NamespaceLimitsModelType
>('NamespaceLimitsSchema', NamespaceLimitsSchema);

export { NamespaceLimitsSchema };

export default NamespaceLimitsModel;
