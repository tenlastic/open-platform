import {
  DatabasePayload,
  EventEmitter,
  changeDataCapturePlugin,
} from '@tenlastic/change-data-capture-module';
import * as mongoose from 'mongoose';
import { InstanceType, ModelType, Ref, Typegoose, index, plugin, prop } from 'typegoose';

import { UserSchema } from '../user/user.model';

export const PasswordResetCreated = new EventEmitter<DatabasePayload<PasswordResetDocument>>();
export const PasswordResetDeleted = new EventEmitter<DatabasePayload<PasswordResetDocument>>();
export const PasswordResetUpdated = new EventEmitter<DatabasePayload<PasswordResetDocument>>();

@index({ expiresAt: 1 }, { expireAfterSeconds: 0 })
@index({ hash: 1 }, { unique: true })
@plugin(changeDataCapturePlugin, {
  OnCreate: PasswordResetCreated,
  OnDelete: PasswordResetDeleted,
  OnUpdate: PasswordResetUpdated,
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
