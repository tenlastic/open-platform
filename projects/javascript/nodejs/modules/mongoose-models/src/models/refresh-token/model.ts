import {
  DocumentType,
  Ref,
  ReturnModelType,
  getModelForClass,
  index,
  modelOptions,
  plugin,
  prop,
} from '@typegoose/typegoose';
import { plugin as uniqueErrorPlugin } from '@tenlastic/mongoose-unique-error';
import * as mongoose from 'mongoose';

import { UserDocument } from '../user';

@index({ expiresAt: 1 }, { expireAfterSeconds: 0 })
@index({ userId: 1 })
@modelOptions({
  schemaOptions: {
    collection: 'refreshtokens',
    minimize: false,
    timestamps: true,
  },
})
@plugin(uniqueErrorPlugin)
export class RefreshTokenSchema {
  public _id: mongoose.Types.ObjectId;
  public createdAt: Date;

  @prop()
  public description: string;

  @prop()
  public expiresAt: Date;

  public updatedAt: Date;

  @prop({ immutable: true, ref: 'UserSchema', required: true })
  public userId: Ref<UserDocument>;
}

export type RefreshTokenDocument = DocumentType<RefreshTokenSchema>;
export type RefreshTokenModel = ReturnModelType<typeof RefreshTokenSchema>;
export const RefreshToken = getModelForClass(RefreshTokenSchema);
