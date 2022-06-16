import {
  DocumentType,
  Ref,
  ReturnModelType,
  getModelForClass,
  index,
  plugin,
  pre,
  prop,
  modelOptions,
} from '@typegoose/typegoose';
import * as mongoose from 'mongoose';

import { EventEmitter, IDatabasePayload, changeStreamPlugin } from '../../change-stream';
import emails from '../../emails';
import * as errors from '../../errors';

export const PasswordResetEvent = new EventEmitter<IDatabasePayload<PasswordResetDocument>>();

@index({ expiresAt: 1 }, { expireAfterSeconds: 0 })
@index({ hash: 1 }, { unique: true })
@index({ userId: 1 })
@modelOptions({
  schemaOptions: {
    collection: 'passwordresets',
    minimize: false,
    timestamps: true,
  },
})
@plugin(changeStreamPlugin, { documentKeys: ['_id'], eventEmitter: PasswordResetEvent })
@plugin(errors.unique.plugin)
@pre('save', async function (this: PasswordResetDocument) {
  if (this.isNew) {
    await emails.sendPasswordResetRequest(this);
  }
})
export class PasswordResetSchema {
  public _id: mongoose.Types.ObjectId;
  public createdAt: Date;

  @prop({ required: true })
  public expiresAt: Date;

  @prop({ required: true })
  public hash: string;

  public updatedAt: Date;

  @prop({ immutable: true, ref: 'UserSchema', required: true })
  public userId: mongoose.Types.ObjectId;
}

export type PasswordResetDocument = DocumentType<PasswordResetSchema>;
export type PasswordResetModel = ReturnModelType<typeof PasswordResetSchema>;
export const PasswordReset = getModelForClass(PasswordResetSchema);
