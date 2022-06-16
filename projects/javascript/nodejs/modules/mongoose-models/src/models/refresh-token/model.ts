import {
  DocumentType,
  ReturnModelType,
  getModelForClass,
  index,
  modelOptions,
  plugin,
  prop,
} from '@typegoose/typegoose';
import * as mongoose from 'mongoose';

import * as errors from '../../errors';

@index({ expiresAt: 1 }, { expireAfterSeconds: 0 })
@index({ userId: 1 })
@modelOptions({
  schemaOptions: {
    collection: 'refreshtokens',
    minimize: false,
    timestamps: true,
  },
})
@plugin(errors.unique.plugin)
export class RefreshTokenSchema {
  public _id: mongoose.Types.ObjectId;
  public createdAt: Date;

  @prop()
  public description: string;

  @prop()
  public expiresAt: Date;

  public updatedAt: Date;

  @prop({ immutable: true, ref: 'UserSchema', required: true })
  public userId: mongoose.Types.ObjectId;
}

export type RefreshTokenDocument = DocumentType<RefreshTokenSchema>;
export type RefreshTokenModel = ReturnModelType<typeof RefreshTokenSchema>;
export const RefreshToken = getModelForClass(RefreshTokenSchema);
