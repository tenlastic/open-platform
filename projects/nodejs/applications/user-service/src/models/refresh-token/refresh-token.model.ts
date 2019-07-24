import {
  DatabasePayload,
  EventEmitter,
  changeDataCapturePlugin,
} from '@tenlastic/change-data-capture-module';
import * as mongoose from 'mongoose';
import { InstanceType, ModelType, Typegoose, index, plugin, prop } from 'typegoose';

export const RefreshTokenCreated = new EventEmitter<DatabasePayload<RefreshTokenDocument>>();
export const RefreshTokenDeleted = new EventEmitter<DatabasePayload<RefreshTokenDocument>>();
export const RefreshTokenUpdated = new EventEmitter<DatabasePayload<RefreshTokenDocument>>();

@index({ expiresAt: 1 }, { expireAfterSeconds: 0 })
@index({ jti: 1 }, { unique: true })
@plugin(changeDataCapturePlugin, {
  OnCreate: RefreshTokenCreated,
  OnDelete: RefreshTokenDeleted,
  OnUpdate: RefreshTokenUpdated,
})
export class RefreshTokenSchema extends Typegoose {
  public _id: mongoose.Types.ObjectId;
  public createdAt: Date;

  @prop({ required: true })
  public expiresAt: Date;

  @prop({ required: true })
  public jti: string;

  public updatedAt: Date;
}

export type RefreshTokenDocument = InstanceType<RefreshTokenSchema>;
export type RefreshTokenModel = ModelType<RefreshTokenSchema>;
export const RefreshToken = new RefreshTokenSchema().getModelForClass(RefreshTokenSchema, {
  schemaOptions: {
    autoIndex: false,
    collection: 'refreshtokens',
    timestamps: true,
  },
});
