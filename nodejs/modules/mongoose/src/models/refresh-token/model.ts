import * as mongoose from 'mongoose';

import { unsetPlugin } from '../../plugins';

export interface RefreshToken {
  _id: mongoose.Types.ObjectId;
  createdAt?: Date;
  expiresAt: Date;
  updatedAt?: Date;
  userId: mongoose.Types.ObjectId;
}

export type RefreshTokenDocument = mongoose.Document<mongoose.Types.ObjectId> & RefreshToken;

export interface RefreshTokenModelType extends mongoose.Model<RefreshTokenDocument> {
  /**
   * Creates a record with randomized required parameters if not specified.
   */
  mock(this: RefreshTokenModelType, values?: Partial<RefreshToken>): RefreshTokenDocument;
}

const RefreshTokenSchema = new mongoose.Schema<RefreshTokenDocument, RefreshTokenModelType>(
  {
    expiresAt: { required: true, type: Date },
    userId: { ref: 'UserSchema', required: true, type: mongoose.Schema.Types.ObjectId },
  },
  { collection: 'refresh-tokens', timestamps: true },
);

RefreshTokenSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });
RefreshTokenSchema.index({ userId: 1 });

RefreshTokenSchema.plugin(unsetPlugin);

RefreshTokenSchema.statics.mock = function (values: Partial<RefreshToken> = {}) {
  const defaults: Partial<RefreshToken> = {
    expiresAt: new Date(),
    userId: new mongoose.Types.ObjectId(),
  };

  return new this({ ...defaults, ...values });
};

export const RefreshTokenModel = mongoose.model<RefreshTokenDocument, RefreshTokenModelType>(
  'RefreshTokenSchema',
  RefreshTokenSchema,
);

export { RefreshTokenSchema };

export default RefreshTokenModel;
