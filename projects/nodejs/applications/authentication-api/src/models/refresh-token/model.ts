import {
  DocumentType,
  Ref,
  ReturnModelType,
  getModelForClass,
  index,
  modelOptions,
  plugin,
  prop,
} from '@hasezoey/typegoose';
import { plugin as uniqueErrorPlugin } from '@tenlastic/mongoose-unique-error';
import * as mongoose from 'mongoose';

import { UserSchema } from '../user/model';

@index({ expiresAt: 1 }, { expireAfterSeconds: 0 })
@index({ jti: 1 }, { unique: true })
@index({ userId: 1 })
@modelOptions({
  schemaOptions: {
    autoIndex: false,
    collection: 'refreshtokens',
    minimize: false,
    timestamps: true,
  },
})
@plugin(uniqueErrorPlugin)
export class RefreshTokenSchema {
  public _id: mongoose.Types.ObjectId;
  public createdAt: Date;

  @prop({ required: true })
  public expiresAt: Date;

  @prop({ required: true })
  public jti: string;

  public updatedAt: Date;

  @prop({ ref: 'UserSchema', required: true })
  public userId: Ref<UserSchema>;
}

export type RefreshTokenDocument = DocumentType<RefreshTokenSchema>;
export type RefreshTokenModel = ReturnModelType<typeof RefreshTokenSchema>;
export const RefreshToken = getModelForClass(RefreshTokenSchema);
