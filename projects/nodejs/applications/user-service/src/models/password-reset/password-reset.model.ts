import { changeDataCapturePlugin } from '@tenlastic/change-data-capture-module';
import * as mongoose from 'mongoose';
import { InstanceType, ModelType, Ref, Typegoose, index, plugin, pre, prop } from 'typegoose';

import * as emails from '../../emails';
import { UserSchema } from '../user/user.model';

@index({ expiresAt: 1 }, { expireAfterSeconds: 0 })
@index({ hash: 1 }, { unique: true })
@plugin(changeDataCapturePlugin)
@pre('save', async function(this: PasswordResetDocument) {
  if (this.isNew) {
    await emails.sendPasswordResetRequest(this);
  }
})
export class PasswordResetSchema extends Typegoose {
  public _id: mongoose.Types.ObjectId;
  public createdAt: Date;

  @prop({ required: true })
  public expiresAt: Date;

  @prop({ required: true })
  public hash: string;

  public updatedAt: Date;

  @prop({ ref: 'UserSchema', required: true })
  public userId: Ref<UserSchema>;

  private _original: Partial<PasswordResetDocument>;
}

export type PasswordResetDocument = InstanceType<PasswordResetSchema>;
export type PasswordResetModel = ModelType<PasswordResetSchema>;
export const PasswordReset = new PasswordResetSchema().getModelForClass(PasswordResetSchema, {
  schemaOptions: {
    autoIndex: false,
    collection: 'passwordresets',
    timestamps: true,
  },
});
