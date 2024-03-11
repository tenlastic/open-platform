import {
  DocumentType,
  getModelForClass,
  index,
  modelOptions,
  plugin,
  prop,
  pre,
} from '@typegoose/typegoose';
import * as bcrypt from 'bcryptjs';
import { Chance } from 'chance';
import * as mongoose from 'mongoose';

import { collation } from '../../constants';
import { duplicateKeyErrorPlugin, unsetPlugin } from '../../plugins';
import { alphanumericValidator, emailValidator } from '../../validators';
import { AuthorizationDocument } from '../authorization/model';

@index({ email: 1 }, { partialFilterExpression: { email: { $exists: true } }, unique: true })
@index({ steamId: 1 }, { partialFilterExpression: { steamId: { $exists: true } }, unique: true })
@index(
  { username: 1 },
  { collation, partialFilterExpression: { username: { $exists: true } }, unique: true },
)
@modelOptions({ schemaOptions: { collation, collection: 'users', timestamps: true } })
@plugin(duplicateKeyErrorPlugin)
@plugin(unsetPlugin)
@pre('save', async function (this: UserDocument) {
  if (this.isModified('password')) {
    this.password = await UserModel.hashPassword(this.password);
  }
})
@pre('validate', function (this: UserDocument) {
  if (!this.password && !this.steamId && !this.username) {
    const message = 'Either (Username and Password) or (Steam ID) must be specified.';
    this.invalidate('password', message, this.password);
    this.invalidate('steamId', message, this.steamId);
    this.invalidate('username', message, this.username);
  } else if (!this.password && !this.steamId && this.username) {
    const message = 'Password must be specified.';
    this.invalidate('password', message, this.password);
  } else if (this.password && !this.username) {
    const message = 'Username must be specified.';
    this.invalidate('username', message, this.username);
  }
})
export class UserSchema {
  public _id: mongoose.Types.ObjectId;
  public createdAt: Date;

  @prop({ lowercase: true, maxlength: 256, trim: true, type: String, validate: [emailValidator] })
  public email: string;

  @prop({ type: String })
  public password: string;

  @prop({ maxlength: 64, trim: true, type: String })
  public steamId: string;

  public updatedAt: Date;

  @prop({
    maxlength: 24,
    trim: true,
    type: String,
    validate: alphanumericValidator,
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
  public static async hashPassword(this: typeof UserModel, plaintext: string) {
    const salt = await bcrypt.genSalt(8);
    return bcrypt.hash(plaintext, salt);
  }

  /**
   * Creates a record with randomized required parameters if not specified.
   */
  public static mock(this: typeof UserModel, values: Partial<UserSchema> = {}) {
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
export const UserModel = getModelForClass(UserSchema);
