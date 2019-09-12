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
} from '@hasezoey/typegoose';
import {
  EventEmitter,
  IDatabasePayload,
  changeStreamPlugin,
} from '@tenlastic/mongoose-change-stream';
import * as kafka from '@tenlastic/mongoose-change-stream-kafka';
import { plugin as uniqueErrorPlugin } from '@tenlastic/mongoose-unique-error';
import * as mongoose from 'mongoose';

import * as emails from '../../emails';
import { UserSchema } from '../user/model';

export const PasswordResetEvent = new EventEmitter<IDatabasePayload<PasswordResetDocument>>();
PasswordResetEvent.on(kafka.publish);

@index({ expiresAt: 1 }, { expireAfterSeconds: 0 })
@index({ hash: 1 }, { unique: true })
@modelOptions({
  schemaOptions: {
    autoIndex: false,
    collection: 'passwordresets',
    minimize: false,
    timestamps: true,
  },
})
@plugin(changeStreamPlugin, {
  documentKeys: ['_id'],
  eventEmitter: PasswordResetEvent,
})
@plugin(uniqueErrorPlugin)
@pre('save', async function(this: PasswordResetDocument) {
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

  @prop({ ref: 'UserSchema', required: true })
  public userId: Ref<UserSchema>;
}

export type PasswordResetDocument = DocumentType<PasswordResetSchema>;
export type PasswordResetModel = ReturnModelType<typeof PasswordResetSchema>;
export const PasswordReset = getModelForClass(PasswordResetSchema);
