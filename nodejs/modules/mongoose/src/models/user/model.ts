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

import { duplicateKeyErrorPlugin, unsetPlugin } from '../../plugins';
import { alphanumericValidator, emailValidator } from '../../validators';
import { AuthorizationDocument } from '../authorization/model';

@index({ email: 1 }, { partialFilterExpression: { email: { $exists: true } }, unique: true })
@index({ username: 1 }, { collation: { locale: 'en_US', strength: 1 }, unique: true })
@modelOptions({ schemaOptions: { collection: 'users', timestamps: true } })
@plugin(duplicateKeyErrorPlugin)
@plugin(unsetPlugin)
@pre('save', async function (this: UserDocument) {
  if (this.isModified('password')) {
    this.password = await UserModel.hashPassword(this.password);
  }
})
export class UserSchema {
  public _id: mongoose.Types.ObjectId;
  public createdAt: Date;

  @prop({ lowercase: true, maxlength: 256, trim: true, type: String, validate: [emailValidator] })
  public email: string;

  @prop({ required: true, type: String })
  public password: string;

  public updatedAt: Date;

  @prop({
    maxlength: 24,
    required: true,
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
