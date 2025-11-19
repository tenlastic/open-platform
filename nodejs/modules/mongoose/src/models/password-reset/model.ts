import { Chance } from 'chance';
import * as mongoose from 'mongoose';

import { duplicateKeyErrorPlugin, unsetPlugin } from '../../plugins';

export interface PasswordReset {
  _id: mongoose.Types.ObjectId;
  createdAt?: Date;
  expiresAt: Date;
  hash: string;
  updatedAt?: Date;
  userId: mongoose.Types.ObjectId;
}

export type PasswordResetDocument = mongoose.Document<mongoose.Types.ObjectId> & PasswordReset;

export interface PasswordResetModelType extends mongoose.Model<PasswordResetDocument> {
  /**
   * Creates a record with randomized required parameters if not specified.
   */
  mock(this: PasswordResetModelType, values?: Partial<PasswordReset>): PasswordResetDocument;
}

const PasswordResetSchema = new mongoose.Schema<PasswordResetDocument, PasswordResetModelType>(
  {
    expiresAt: { required: true, type: Date },
    hash: { maxlength: 128, required: true, trim: true, type: String },
    userId: { ref: 'UserSchema', required: true, type: mongoose.Schema.Types.ObjectId },
  },
  { collection: 'password-resets', timestamps: true },
);

PasswordResetSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
PasswordResetSchema.index({ hash: 1 }, { unique: true });
PasswordResetSchema.index({ userId: 1 });

PasswordResetSchema.plugin(duplicateKeyErrorPlugin);
PasswordResetSchema.plugin(unsetPlugin);

PasswordResetSchema.statics.mock = function (values: Partial<PasswordReset> = {}) {
  const chance = new Chance();
  const defaults: Partial<PasswordReset> = {
    expiresAt: new Date(new Date().getTime() + 24 * 60 * 60 * 1000),
    hash: chance.hash({ length: 128 }),
    userId: new mongoose.Types.ObjectId(),
  };

  return new this({ ...defaults, ...values });
};

export const PasswordResetModel = mongoose.model<PasswordResetDocument, PasswordResetModelType>(
  'PasswordResetSchema',
  PasswordResetSchema,
);

export { PasswordResetSchema };

export default PasswordResetModel;
