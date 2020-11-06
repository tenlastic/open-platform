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

import * as emails from '../../emails';
import { RefreshToken, RefreshTokenDocument } from '../refresh-token/model';
import { UserPermissions } from './';

const UserEvent = new EventEmitter<IDatabasePayload<UserDocument>>();
UserEvent.on(payload => {
  kafka.publish(payload);
});

export enum UserRole {
  Articles = 'articles',
  Builds = 'builds',
  Collections = 'collections',
  GameServers = 'game-servers',
  GameInvitations = 'game-invitations',
  Games = 'games',
  Namespaces = 'namespaces',
  Queues = 'queues',
  Users = 'users',
}

@index(
  { email: 1 },
  {
    partialFilterExpression: {
      email: { $type: 'string' },
    },
    unique: true,
  },
)
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
    trim: true,
    validate: [emailValidator],
  })
  public email: string;

  @prop({ required: true })
  public password: string;

  @arrayProp({ default: [], enum: UserRole, items: String })
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
  public async logIn(this: UserDocument, jti?: string) {
    // Save the RefreshToken for renewal and revocation.
    const expiresAt = new Date(new Date().getTime() + 14 * 24 * 60 * 60 * 1000);

    let token: RefreshTokenDocument;
    if (jti) {
      token = await RefreshToken.findOneAndUpdate(
        {
          _id: jti,
          userId: this._id,
        },
        {
          expiresAt,
          updatedAt: new Date(),
        },
        {
          new: true,
        },
      );
    } else {
      token = await RefreshToken.create({ expiresAt, userId: this._id });
    }

    // Remove unauthorized fields from the User.
    const filteredUser = await UserPermissions.read(this, this);

    const accessToken = jwt.sign(
      { type: 'access', user: filteredUser },
      process.env.JWT_PRIVATE_KEY.replace(/\\n/g, '\n'),
      {
        algorithm: 'RS256',
        expiresIn: '30m',
        jwtid: token._id.toString(),
      },
    );
    const refreshToken = jwt.sign(
      { type: 'refresh', user: filteredUser },
      process.env.JWT_PRIVATE_KEY.replace(/\\n/g, '\n'),
      {
        algorithm: 'RS256',
        expiresIn: '14d',
        jwtid: token._id.toString(),
      },
    );

    return { accessToken, refreshToken };
  }
}

export type UserDocument = DocumentType<UserSchema>;
export type UserModel = ReturnModelType<typeof UserSchema>;
export const User = getModelForClass(UserSchema);
