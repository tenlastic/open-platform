import {
  DatabasePayload,
  EventEmitter,
  changeDataCapturePlugin,
} from '@tenlastic/change-data-capture-module';
import {
  alphanumericValidator,
  emailValidator,
  stringLengthValidator,
} from '@tenlastic/validations-module';
import * as bcrypt from 'bcrypt';
import * as mongoose from 'mongoose';
import {
  InstanceType,
  ModelType,
  Typegoose,
  index,
  instanceMethod,
  plugin,
  pre,
  prop,
  staticMethod,
} from 'typegoose';

export const UserCreated = new EventEmitter<DatabasePayload<UserDocument>>();
export const UserDeleted = new EventEmitter<DatabasePayload<UserDocument>>();
export const UserUpdated = new EventEmitter<DatabasePayload<UserDocument>>();

@index({ email: 1 }, { unique: true })
@index({ username: 1 }, { unique: true })
@plugin(changeDataCapturePlugin, {
  OnCreate: UserCreated,
  OnDelete: UserDeleted,
  OnUpdate: UserUpdated,
})
@pre<UserSchema>('save', async function(this: UserDocument) {
  if (this.isModified('password')) {
    this.password = await User.hashPassword(this.password);
  }
})
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

  @prop({ default: 0 })
  public level: number;

  @prop({ required: true })
  public password: string;

  public updatedAt: Date;

  @prop({
    required: true,
    trim: true,
    validate: [alphanumericValidator, stringLengthValidator(0, 20)],
  })
  public username: string;

  /**
   * Hashes a plaintext password.
   */
  @staticMethod
  public static async hashPassword(this: UserModel, plaintext: string) {
    const salt = await bcrypt.genSalt(8);
    return bcrypt.hash(plaintext, salt);
  }

  /**
   * Checks if a plaintext password is valid.
   */
  @instanceMethod
  public isValidPassword(this: UserDocument, plaintext: string) {
    return bcrypt.compare(plaintext, this.password);
  }
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
