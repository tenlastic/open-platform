import {
  alphanumericValidator,
  emailValidator,
  stringLengthValidator,
} from '@tenlastic/validations-module';
import * as bcrypt from 'bcrypt';
import * as mongoose from 'mongoose';
import { InstanceType, ModelType, Typegoose, index, instanceMethod, pre, prop } from 'typegoose';

// Indexes
@index({ email: 1 }, { unique: true })
@index({ username: 1 }, { unique: true })
// Hooks
@pre<UserSchema>('save', async function(this: InstanceType<UserSchema>) {
  if (this.isActive && !this.activatedAt) {
    this.activatedAt = new Date();
    this.markModified('activatedAt');
  }

  if (this.isModified('password')) {
    this.password = this.hashPassword(this.password);
    this.markModified('password');
  }

  (this as any).modified = this.modifiedPaths();
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

  @prop({
    default: false,
  })
  public isActive: boolean;

  @prop()
  public lastLoginAt: Date;

  @prop({
    default: 0,
  })
  public level: number;

  @prop({
    required: true,
  })
  public password: string;

  @prop()
  public resetHash: mongoose.Types.ObjectId;

  public updatedAt: Date;

  @prop({
    required: true,
    trim: true,
    validate: [alphanumericValidator, stringLengthValidator(0, 20)],
  })
  public username: string;

  /**
   * Hashes a plain-text password.
   */
  @instanceMethod
  public hashPassword(this: InstanceType<UserSchema>, password: string) {
    return bcrypt.hashSync(password, bcrypt.genSaltSync(8));
  }

  /**
   * Checks if a password is valid.
   */
  @instanceMethod
  public isValidPassword(this: InstanceType<UserSchema>, password: string) {
    return bcrypt.compareSync(password, this.password);
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
