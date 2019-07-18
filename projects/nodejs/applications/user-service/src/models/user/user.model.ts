import {
  alphanumericValidator,
  emailValidator,
  stringLengthValidator,
} from '@tenlastic/validations-module';
import * as mongoose from 'mongoose';
import { InstanceType, ModelType, Typegoose, index, prop } from 'typegoose';

@index({ email: 1 }, { unique: true })
@index({ username: 1 }, { unique: true })
export class UserSchema extends Typegoose {
  public _id: mongoose.Types.ObjectId;

  @prop()
  public activatedAt: Date;

  public createdAt: Date;

  @prop({
    required: true,
    trim: true,
    validate: [emailValidator],
  })
  public email: string;

  @prop({
    default: 0,
  })
  public level: number;

  public updatedAt: Date;

  @prop({
    required: true,
    trim: true,
    validate: [alphanumericValidator, stringLengthValidator(0, 20)],
  })
  public username: string;
}

export type UserDocument = InstanceType<UserSchema>;
export type UserModel = ModelType<UserSchema>;
export const User = new UserSchema().getModelForClass(UserSchema, {
  schemaOptions: {
    autoIndex: false,
    collation: {
      locale: 'en_US',
      strength: 1,
    },
    collection: 'users',
    timestamps: true,
  },
});
