import {
  DatabasePayload,
  EventEmitter,
  changeDataCapturePlugin,
} from '@tenlastic/change-data-capture-module';
import * as mongoose from 'mongoose';
import { InstanceType, ModelType, Typegoose, index, plugin, prop } from 'typegoose';

export const PasswordResetCreated = new EventEmitter<DatabasePayload<PasswordResetDocument>>();
export const PasswordResetDeleted = new EventEmitter<DatabasePayload<PasswordResetDocument>>();
export const PasswordResetUpdated = new EventEmitter<DatabasePayload<PasswordResetDocument>>();

@index({ createdAt: 1 }, { expireAfterSeconds: 24 * 60 * 60 })
@index({ hash: 1 })
@plugin(changeDataCapturePlugin, {
  OnCreate: PasswordResetCreated,
  OnDelete: PasswordResetDeleted,
  OnUpdate: PasswordResetUpdated,
})
export class PasswordResetSchema extends Typegoose {
  public _id: mongoose.Types.ObjectId;
  public createdAt: Date;

  @prop({
    required: true,
  })
  public hash: string;

  public updatedAt: Date;

  @prop({
    required: true,
  })
  public userId: mongoose.Types.ObjectId;
}

export type PasswordResetDocument = InstanceType<PasswordResetSchema>;
export type PasswordResetModel = ModelType<PasswordResetSchema>;
export const PasswordReset = new PasswordResetSchema().getModelForClass(PasswordResetSchema, {
  schemaOptions: {
    autoIndex: false,
    collation: {
      locale: 'en_US',
      strength: 1,
    },
    collection: 'passwordresets',
    timestamps: true,
  },
});
