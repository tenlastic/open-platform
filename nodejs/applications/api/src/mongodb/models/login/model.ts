import { changeStreamPlugin, EventEmitter, IDatabasePayload } from '@tenlastic/mongoose-models';
import {
  DocumentType,
  ReturnModelType,
  getModelForClass,
  index,
  modelOptions,
  plugin,
  prop,
} from '@typegoose/typegoose';
import * as jwt from 'jsonwebtoken';
import * as mongoose from 'mongoose';

import { Authorization } from '../authorization';
import { RefreshToken, RefreshTokenDocument } from '../refresh-token';
import { UserDocument } from '../user';

export const OnLoginProduced = new EventEmitter<IDatabasePayload<LoginDocument>>();

@index({ userId: 1 })
@modelOptions({ schemaOptions: { collection: 'logins', minimize: false, timestamps: true } })
@plugin(changeStreamPlugin, { documentKeys: ['_id'], eventEmitter: OnLoginProduced })
export class LoginSchema {
  public _id: mongoose.Types.ObjectId;
  public createdAt: Date;

  @prop({ immutable: true, ref: 'RefreshTokenSchema', required: true })
  public refreshTokenId: mongoose.Types.ObjectId;

  @prop({ immutable: true, ref: 'UserSchema', required: true })
  public userId: mongoose.Types.ObjectId;

  public updatedAt: Date;

  @prop({ foreignField: '_id', justOne: true, localField: 'userId', ref: 'UserSchema' })
  public userDocument: UserDocument;

  /**
   * Creates an access and refresh token.
   */
  public static async createAccessAndRefreshTokens(
    user: UserDocument,
    refreshTokenId?: mongoose.Types.ObjectId | string,
  ) {
    // Get the User's Authorization.
    const authorization = await Authorization.findOne({
      namespaceId: { $exists: false },
      userId: user._id,
    });

    // Save the RefreshToken for renewal and revocation.
    const expiresAt = new Date(new Date().getTime() + 14 * 24 * 60 * 60 * 1000);
    let token: RefreshTokenDocument;
    if (refreshTokenId) {
      token = await RefreshToken.findOneAndUpdate(
        { _id: refreshTokenId, userId: user._id },
        { expiresAt, updatedAt: new Date() },
        { new: true },
      );
    } else {
      token = await RefreshToken.create({ expiresAt, userId: user._id });
    }

    // Remove unauthorized fields from the Authorization and User.
    const filteredAuthorization = authorization
      ? { _id: authorization._id, roles: authorization.roles }
      : null;
    const filteredUser = { _id: user._id, email: user.email, username: user.username };

    const options = { algorithm: 'RS256', expiresIn: '14d', jwtid: token._id.toString() };
    const privateKey = process.env.JWT_PRIVATE_KEY.replace(/\\n/g, '\n');

    const accessToken = jwt.sign(
      { authorization: filteredAuthorization ?? undefined, type: 'access', user: filteredUser },
      privateKey,
      { ...options, expiresIn: '30m' },
    );
    const refreshToken = jwt.sign({ type: 'refresh', user: filteredUser }, privateKey, options);

    return { accessToken, refreshToken, refreshTokenId: token._id };
  }
}

export type LoginDocument = DocumentType<LoginSchema>;
export type LoginModel = ReturnModelType<typeof LoginSchema>;
export const Login = getModelForClass(LoginSchema);
