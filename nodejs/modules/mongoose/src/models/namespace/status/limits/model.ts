import * as mongoose from 'mongoose';

export interface NamespaceStatusLimits {
  bandwidth?: number;
  cpu?: number;
  memory?: number;
  storage?: number;
}

export type NamespaceStatusLimitsDocument = mongoose.Document<mongoose.Types.ObjectId> &
  NamespaceStatusLimits;

export interface NamespaceStatusLimitsModelType
  extends mongoose.Model<NamespaceStatusLimitsDocument> {
  /**
   * Creates a record with randomized required parameters if not specified.
   */
  mock(
    this: NamespaceStatusLimitsModelType,
    values?: Partial<NamespaceStatusLimits>,
  ): NamespaceStatusLimitsDocument;
}

const NamespaceStatusLimitsSchema = new mongoose.Schema<
  NamespaceStatusLimitsDocument,
  NamespaceStatusLimitsModelType
>(
  {
    bandwidth: { default: 0, type: Number },
    cpu: { default: 0, type: Number },
    memory: { default: 0, type: Number },
    storage: { default: 0, type: Number },
  },
  { _id: false },
);

NamespaceStatusLimitsSchema.statics.mock = function (values: Partial<NamespaceStatusLimits> = {}) {
  const defaults: Partial<NamespaceStatusLimits> = {};

  return new this({ ...defaults, ...values });
};

export const NamespaceStatusLimitsModel = mongoose.model<
  NamespaceStatusLimitsDocument,
  NamespaceStatusLimitsModelType
>('NamespaceStatusLimitsSchema', NamespaceStatusLimitsSchema);

export { NamespaceStatusLimitsSchema };

export default NamespaceStatusLimitsModel;
