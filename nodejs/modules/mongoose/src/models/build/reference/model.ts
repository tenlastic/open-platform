import * as mongoose from 'mongoose';

export interface BuildReference {
  _id: mongoose.Types.ObjectId;
  files?: string[];
}

export type BuildReferenceDocument = mongoose.Document<mongoose.Types.ObjectId> & BuildReference;

export interface BuildReferenceModelType extends mongoose.Model<BuildReferenceDocument> {
  /**
   * Creates a record with randomized required parameters if not specified.
   */
  mock(this: BuildReferenceModelType, values?: Partial<BuildReference>): BuildReferenceDocument;
}

const BuildReferenceSchema = new mongoose.Schema<BuildReferenceDocument, BuildReferenceModelType>(
  {
    _id: { ref: 'BuildSchema', required: true, type: mongoose.Schema.Types.ObjectId },
    files: { maxlength: 256, trim: true, type: [String] },
  },
  { _id: false },
);

BuildReferenceSchema.statics.mock = function (values: Partial<BuildReference> = {}) {
  const defaults: Partial<BuildReference> = { _id: new mongoose.Types.ObjectId() };

  return new this({ ...defaults, ...values });
};

export const BuildReferenceModel = mongoose.model<BuildReferenceDocument, BuildReferenceModelType>(
  'BuildReferenceSchema',
  BuildReferenceSchema,
);

export { BuildReferenceSchema };

export default BuildReferenceModel;
