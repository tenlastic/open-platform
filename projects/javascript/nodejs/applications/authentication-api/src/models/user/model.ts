import {
  DocumentType,
  ReturnModelType,
  arrayProp,
  getModelForClass,
  index,
  modelOptions,
  plugin,
  pre,
  prop,
} from '@hasezoey/typegoose';
import {
  EventEmitter,
  IDatabasePayload,
  changeStreamPlugin,
} from '@tenlastic/mongoose-change-stream';
import * as kafka from '@tenlastic/mongoose-change-stream-kafka';
import { plugin as uniqueErrorPlugin } from '@tenlastic/mongoose-unique-error';
import {
  alphanumericValidator,
  emailValidator,
  stringLengthValidator,
} from '@tenlastic/validations';
import * as bcrypt from 'bcryptjs';
import * as jwt from 'jsonwebtoken';
import * as mongoose from 'mongoose';
import * as uuid from 'uuid/v4';

import * as emails from '../../emails';
import { RefreshToken } from '../refresh-token/model';
import { UserPermissions } from './';

const UserEvent = new EventEmitter<IDatabasePayload<UserDocument>>();
UserEvent.on(kafka.publish);

@index({ email: 1 }, { unique: true })
@index(
  { username: 1 },
  {
    collation: {
      locale: 'en_US',
      strength: 1,
    },
    unique: true,
  },
)
@index({ roles: 1 })
@modelOptions({
  schemaOptions: {
    autoIndex: true,
    collation: {
      locale: 'en_US',
      strength: 1,
    },
    collection: 'users',
    minimize: false,
    timestamps: true,
  },
})
@plugin(changeStreamPlugin, {
  documentKeys: ['_id'],
  eventEmitter: UserEvent,
})
@plugin(uniqueErrorPlugin)
@pre('save', async function(this: UserDocument) {
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
    required: true,
    trim: true,
    validate: [emailValidator],
  })
  public email: string;

  @prop({ required: true })
  public password: string;

  @arrayProp({ default: [], items: String })
  public roles: string[];

  public updatedAt: Date;

  @prop({
    required: true,
    trim: true,
    validate: [alphanumericValidator, stringLengthValidator(0, 20)],
  })
  public username: string;

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

  /**
   * Creates an access and refresh token.
   */
  public async logIn(this: UserDocument) {
    // Save the RefreshToken for renewal and revocation.
    const jti = uuid();
    const expiresAt = new Date(new Date().getTime() + 14 * 24 * 60 * 60 * 1000);
    await RefreshToken.create({ expiresAt, jti, userId: this._id });

    // Remove unauthorized fields from the User.
    const filteredUser = await UserPermissions.read(this, this);

    const accessToken = jwt.sign({ user: filteredUser }, process.env.JWT_SECRET, {
      expiresIn: '30m',
      jwtid: jti,
    });
    const refreshToken = jwt.sign({ user: filteredUser }, process.env.JWT_SECRET, {
      expiresIn: '14d',
      jwtid: jti,
    });

    return { accessToken, refreshToken };
  }
}

export type UserDocument = DocumentType<UserSchema>;
export type UserModel = ReturnModelType<typeof UserSchema>;
export const User = getModelForClass(UserSchema);
