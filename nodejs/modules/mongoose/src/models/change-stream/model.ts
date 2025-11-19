import { Chance } from 'chance';
import * as mongoose from 'mongoose';

import { duplicateKeyErrorPlugin, unsetPlugin } from '../../plugins';

export interface ChangeStream {
  _id: mongoose.Types.ObjectId;
  createdAt?: Date;
  key: string;
  resumeToken?: string;
  updatedAt?: Date;
}

export type ChangeStreamDocument = mongoose.Document<mongoose.Types.ObjectId> & ChangeStream;

export interface ChangeStreamModelType extends mongoose.Model<ChangeStreamDocument> {
  /**
   * Creates a record with randomized required parameters if not specified.
   */
  mock(this: ChangeStreamModelType, values?: Partial<ChangeStream>): ChangeStreamDocument;
}

const ChangeStreamSchema = new mongoose.Schema<ChangeStreamDocument, ChangeStreamModelType>(
  {
    key: { maxlength: 64, required: true, trim: true, type: String },
    resumeToken: { maxlength: 256, trim: true, type: String },
  },
  {
    collection: 'change-streams',
    timestamps: true,
  },
);

ChangeStreamSchema.index({ key: 1 }, { unique: true });

ChangeStreamSchema.plugin(duplicateKeyErrorPlugin);
ChangeStreamSchema.plugin(unsetPlugin);

ChangeStreamSchema.statics.mock = function (values: Partial<ChangeStream> = {}) {
  const chance = new Chance();
  const defaults: Partial<ChangeStream> = { key: chance.hash() };

  return new this({ ...defaults, ...values });
};

export const ChangeStreamModel = mongoose.model<ChangeStreamDocument, ChangeStreamModelType>(
  'ChangeStreamSchema',
  ChangeStreamSchema,
);

export default ChangeStreamModel;
