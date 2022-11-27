import {
  DocumentType,
  getModelForClass,
  index,
  modelOptions,
  prop,
  ReturnModelType,
} from '@typegoose/typegoose';
import * as jsonwebtoken from 'jsonwebtoken';
import * as mongoose from 'mongoose';

import { AuthorizationSchema } from '../authorization';
import { RefreshTokenDocument, RefreshTokenSchema } from '../refresh-token';
import { UserDocument } from '../user';

@index({ userId: 1 })
@modelOptions({ schemaOptions: { collection: 'logins', minimize: false, timestamps: true } })
export class LoginSchema {
  public _id: mongoose.Types.ObjectId;
  public createdAt: Date;

  @prop({ ref: 'RefreshTokenSchema', required: true, type: mongoose.Schema.Types.ObjectId })
  public refreshTokenId: mongoose.Types.ObjectId;

  @prop({ ref: 'UserSchema', required: true, type: mongoose.Schema.Types.ObjectId })
  public userId: mongoose.Types.ObjectId;

  public updatedAt: Date;

  /**
   * Creates an access and refresh token.
   */
  public static async createAccessAndRefreshTokens(
    user: UserDocument,
    refreshTokenId?: mongoose.Types.ObjectId | string,
  ) {
    // Get the User's Authorization.
    const Authorization = getModelForClass(AuthorizationSchema);
    const authorization = await Authorization.findOne({
      namespaceId: { $exists: false },
      userId: user._id,
    });

    // Save the RefreshToken for renewal and revocation.
    const expiresAt = new Date(new Date().getTime() + 14 * 24 * 60 * 60 * 1000);
    const RefreshToken = getModelForClass(RefreshTokenSchema);
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

    const accessToken = jsonwebtoken.sign(
      { authorization: filteredAuthorization ?? undefined, type: 'access', user: filteredUser },
      privateKey,
      { ...options, expiresIn: '30m' },
    );
    const refreshToken = jsonwebtoken.sign(
      { type: 'refresh', user: filteredUser },
      privateKey,
      options,
    );

    return { accessToken, refreshToken, refreshTokenId: token._id };
  }

  /**
   * Creates a record with randomized required parameters if not specified.
   */
  public static mock(this: LoginModel, values: Partial<LoginSchema> = {}) {
    const defaults = { userId: new mongoose.Types.ObjectId() };

    return new this({ ...defaults, ...values });
  }
}

export type LoginDocument = DocumentType<LoginSchema>;
export type LoginModel = ReturnModelType<typeof LoginSchema>;
export const Login = getModelForClass(LoginSchema);
