import {
  DocumentType,
  ReturnModelType,
  getModelForClass,
  index,
  modelOptions,
  plugin,
  pre,
  prop,
} from '@typegoose/typegoose';
import * as bcrypt from 'bcryptjs';
import * as mongoose from 'mongoose';

import { EventEmitter, IDatabasePayload, changeStreamPlugin } from '../../change-stream';
import emails from '../../emails';
import * as errors from '../../errors';
import { alphanumericValidator, emailValidator, stringLengthValidator } from '../../validators';
import { AuthorizationDocument } from '../authorization/model';

export const UserEvent = new EventEmitter<IDatabasePayload<UserDocument>>();

export enum UserRole {
  Articles = 'articles',
  Authorizations = 'authorizations',
  Builds = 'builds',
  Collections = 'collections',
  GameServers = 'game-servers',
  Games = 'games',
  Namespaces = 'namespaces',
  Queues = 'queues',
  Users = 'users',
  Workflows = 'workflows',
}

@index({ email: 1 }, { partialFilterExpression: { email: { $type: 'string' } }, unique: true })
@index({ username: 1 }, { collation: { locale: 'en_US', strength: 1 }, unique: true })
@index({ roles: 1 })
@modelOptions({
  schemaOptions: {
    collation: { locale: 'en_US', strength: 1 },
    collection: 'users',
    minimize: false,
    timestamps: true,
  },
})
@plugin(changeStreamPlugin, { documentKeys: ['_id'], eventEmitter: UserEvent })
@plugin(errors.unique.plugin)
@pre('save', async function (this: UserDocument) {
  if (!this.isNew && this._original.password !== this.password) {
    await emails.sendPasswordResetConfirmation(this);
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
    validate: [emailValidator],
  })
  public email: string;

  @prop({ required: true })
  public password: string;

  @prop({ enum: UserRole, type: String })
  public roles: string[];

  public updatedAt: Date;

  @prop({
    required: true,
    trim: true,
    validate: [alphanumericValidator, stringLengthValidator(0, 20)],
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

  private _original: Partial<UserDocument>;

  /**
   * Hashes a plaintext password.
   */
  public static async hashPassword(this: UserModel, plaintext: string) {
    const salt = await bcrypt.genSalt(8);
    return bcrypt.hash(plaintext, salt);
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
