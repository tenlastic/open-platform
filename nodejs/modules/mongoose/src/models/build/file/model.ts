import { Chance } from 'chance';
import * as mongoose from 'mongoose';

export interface BuildFile {
  compressedBytes: number;
  md5: string;
  path: string;
  uncompressedBytes: number;
}

export type BuildFileDocument = mongoose.Document<mongoose.Types.ObjectId> & BuildFile;

export interface BuildFileModelType extends mongoose.Model<BuildFileDocument> {
  /**
   * Creates a record with randomized required parameters if not specified.
   */
  mock(this: BuildFileModelType, values?: Partial<BuildFile>): BuildFileDocument;
}

const BuildFileSchema = new mongoose.Schema<BuildFileDocument, BuildFileModelType>(
  {
    compressedBytes: { required: true, type: Number },
    md5: { maxlength: 128, required: true, trim: true, type: String },
    path: { maxlength: 256, required: true, trim: true, type: String },
    uncompressedBytes: { required: true, type: Number },
  },
  { _id: false },
);

BuildFileSchema.statics.mock = function (values: Partial<BuildFile> = {}) {
  const chance = new Chance();
  const defaults: Partial<BuildFile> = {
    compressedBytes: chance.integer(),
    md5: chance.hash(),
    path: chance.hash(),
    uncompressedBytes: chance.integer(),
  };

  return new this({ ...defaults, ...values });
};

export const BuildFileModel = mongoose.model<BuildFileDocument, BuildFileModelType>(
  'BuildFileSchema',
  BuildFileSchema,
);

export { BuildFileSchema };

export default BuildFileModel;
