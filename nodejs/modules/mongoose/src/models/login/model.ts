import {
  DocumentType,
  getModelForClass,
  index,
  modelOptions,
  plugin,
  prop,
} from '@typegoose/typegoose';
import * as jsonwebtoken from 'jsonwebtoken';
import * as mongoose from 'mongoose';

import { unsetPlugin } from '../../plugins';
import { AuthorizationModel } from '../authorization';
import { RefreshTokenDocument, RefreshTokenModel } from '../refresh-token';
import { UserDocument } from '../user';

interface CreateAccessAndRefreshTokensOptions {
  expiresIn?: number;
  provider?: 'steam' | 'tenlastic';
  refreshTokenId?: mongoose.Types.ObjectId | string;
}

@index({ userId: 1 })
@modelOptions({ schemaOptions: { collection: 'logins', timestamps: true } })
@plugin(unsetPlugin)
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
    options?: CreateAccessAndRefreshTokensOptions,
  ) {
    // Get the User's Authorization.
    const authorization = await AuthorizationModel.findOne({
      namespaceId: { $exists: false },
      userId: user._id,
    });

    // Save the Refresh Token for renewal and revocation.
    const expiresIn = options?.expiresIn || 14 * 24 * 60 * 60 * 1000;
    const expiresAt = new Date(Date.now() + expiresIn);
    let token: RefreshTokenDocument;
    if (options?.refreshTokenId) {
      token = await RefreshTokenModel.findOneAndUpdate(
        { _id: options.refreshTokenId, userId: user._id },
        { expiresAt, updatedAt: new Date() },
        { new: true },
      );
    } else {
      token = await RefreshTokenModel.create({ expiresAt, userId: user._id });
    }

    // Remove unauthorized fields from the Authorization and User.
    const filteredAuthorization = authorization
      ? { _id: authorization._id, roles: authorization.roles }
      : null;
    const filteredUser = {
      _id: user._id,
      steamId: user.steamId,
      steamPersonaName: user.steamPersonaName,
      username: user.username,
    };

    const algorithm = 'RS256';
    const privateKey = process.env.JWT_PRIVATE_KEY.replace(/\\n/g, '\n');
    const provider = options?.provider || 'tenlastic';

    const accessToken = jsonwebtoken.sign(
      {
        authorization: filteredAuthorization ?? undefined,
        provider,
        type: 'access',
        user: filteredUser,
      },
      privateKey,
      { algorithm, expiresIn: '30m', jwtid: `${token._id}` },
    );
    const refreshToken = jsonwebtoken.sign(
      { provider, type: 'refresh', user: filteredUser },
      privateKey,
      { algorithm, expiresIn: expiresIn / 1000, jwtid: `${token._id}` },
    );

    return { accessToken, refreshToken, refreshTokenId: token._id };
  }

  /**
   * Creates a record with randomized required parameters if not specified.
   */
  public static mock(this: typeof LoginModel, values: Partial<LoginSchema> = {}) {
    const defaults = { userId: new mongoose.Types.ObjectId() };

    return new this({ ...defaults, ...values });
  }
}

export type LoginDocument = DocumentType<LoginSchema>;
export const LoginModel = getModelForClass(LoginSchema);
