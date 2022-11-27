import {
  DocumentType,
  getModelForClass,
  index,
  modelOptions,
  plugin,
  prop,
  pre,
  ReturnModelType,
} from '@typegoose/typegoose';
import * as bcrypt from 'bcryptjs';
import { Chance } from 'chance';
import * as mongoose from 'mongoose';

import { duplicateKeyErrorPlugin } from '../../plugins';
import { alphanumericValidator, emailValidator, stringLengthValidator } from '../../validators';
import { AuthorizationDocument } from '../authorization/model';

@index({ email: 1 }, { partialFilterExpression: { email: { $type: 'string' } }, unique: true })
@index({ username: 1 }, { collation: { locale: 'en_US', strength: 1 }, unique: true })
@modelOptions({
  schemaOptions: {
    collation: { locale: 'en_US', strength: 1 },
    collection: 'users',
    minimize: false,
    timestamps: true,
  },
})
@plugin(duplicateKeyErrorPlugin)
@pre('save', async function (this: UserDocument) {
  if (this.isModified('email') && this.email === '') {
    this.email = undefined;
  }

  if (this.isModified('password')) {
    this.password = await User.hashPassword(this.password);
  }
})
export class UserSchema {
  public _id: mongoose.Types.ObjectId;
  public createdAt: Date;

  @prop({
    lowercase: true,
    trim: true,
    type: String,
    validate: [emailValidator],
  })
  public email: string;

  @prop({ required: true, type: String })
  public password: string;

  public updatedAt: Date;

  @prop({
    required: true,
    trim: true,
    type: String,
    validate: [alphanumericValidator, stringLengthValidator(0, 24)],
  })
  public username: string;

  @prop({
    foreignField: 'userId',
    justOne: true,
    localField: '_id',
    match: { namespaceId: { $exists: false } },
    ref: 'AuthorizationSchema',
  })
  public authorizationDocument: AuthorizationDocument;

  /**
   * Hashes a plaintext password.
   */
  public static async hashPassword(this: UserModel, plaintext: string) {
    const salt = await bcrypt.genSalt(8);
    return bcrypt.hash(plaintext, salt);
  }

  /**
   * Creates a record with randomized required parameters if not specified.
   */
  public static mock(this: UserModel, values: Partial<UserSchema> = {}) {
    const chance = new Chance();
    const defaults = {
      email: chance.email(),
      password: chance.hash(),
      username: chance.hash({ length: 24 }),
    };

    return new this({ ...defaults, ...values });
  }

  /**
   * Checks if a plaintext password is valid.
   */
  public isValidPassword(this: UserDocument, plaintext: string) {
    return bcrypt.compare(plaintext, this.password);
  }
}

export type UserDocument = DocumentType<UserSchema>;
export type UserModel = ReturnModelType<typeof UserSchema>;
export const User = getModelForClass(UserSchema);
