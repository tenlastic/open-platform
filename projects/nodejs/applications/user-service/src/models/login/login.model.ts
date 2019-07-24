import {
  DatabasePayload,
  EventEmitter,
  changeDataCapturePlugin,
} from '@tenlastic/change-data-capture-module';
import * as mongoose from 'mongoose';
import { InstanceType, ModelType, Typegoose, index, plugin, prop } from 'typegoose';

export const LoginCreated = new EventEmitter<DatabasePayload<LoginDocument>>();
export const LoginDeleted = new EventEmitter<DatabasePayload<LoginDocument>>();
export const LoginUpdated = new EventEmitter<DatabasePayload<LoginDocument>>();

@index({ userId: 1 })
@plugin(changeDataCapturePlugin, {
  OnCreate: LoginCreated,
  OnDelete: LoginDeleted,
  OnUpdate: LoginUpdated,
})
export class LoginSchema extends Typegoose {
  public _id: mongoose.Types.ObjectId;
  public createdAt: Date;

  @prop()
  public ip: string;

  @prop()
  public userAgent: string;

  @prop({ required: true })
  public userId: mongoose.Types.ObjectId;

  public updatedAt: Date;
}

export type LoginDocument = InstanceType<LoginSchema>;
export type LoginModel = ModelType<LoginSchema>;
export const Login = new LoginSchema().getModelForClass(LoginSchema, {
  schemaOptions: {
    autoIndex: false,
    collection: 'logins',
    timestamps: true,
  },
});
