import { EventEmitter, changeStreamPlugin } from '@tenlastic/mongoose-change-stream';
import * as mongoose from 'mongoose';
import { InstanceType, ModelType, Ref, Typegoose, index, plugin, prop } from 'typegoose';

import { UserSchema } from '../user/model';

const RefreshTokenEvent = new EventEmitter<RefreshTokenDocument>();

@index({ expiresAt: 1 }, { expireAfterSeconds: 0 })
@index({ jti: 1 }, { unique: true })
@index({ userId: 1 })
@plugin(changeStreamPlugin, {
  documentKeys: ['_id'],
  eventEmitter: RefreshTokenEvent,
  fullDocumentOnSave: true,
})
export class RefreshTokenSchema extends Typegoose {
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

export type RefreshTokenDocument = InstanceType<RefreshTokenSchema>;
export type RefreshTokenModel = ModelType<RefreshTokenSchema>;
export const RefreshToken = new RefreshTokenSchema().getModelForClass(RefreshTokenSchema, {
  schemaOptions: {
    autoIndex: false,
    collection: 'refreshtokens',
    minimize: false,
    timestamps: true,
  },
});
