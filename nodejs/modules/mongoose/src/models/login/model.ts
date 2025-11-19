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

export interface Login {
  _id: mongoose.Types.ObjectId;
  createdAt?: Date;
  refreshTokenId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  updatedAt?: Date;
}

export type LoginDocument = mongoose.Document<mongoose.Types.ObjectId> & Login;

export interface LoginModelType extends mongoose.Model<LoginDocument> {
  /**
   * Creates an access and refresh token.
   */
  createAccessAndRefreshTokens(
    user: UserDocument,
    options?: CreateAccessAndRefreshTokensOptions,
  ): Promise<{
    accessToken: string;
    refreshToken: string;
    refreshTokenId: mongoose.Types.ObjectId;
  }>;

  /**
   * Creates a record with randomized required parameters if not specified.
   */
  mock(this: LoginModelType, values?: Partial<Login>): LoginDocument;
}

const LoginSchema = new mongoose.Schema<LoginDocument, LoginModelType>(
  {
    refreshTokenId: {
      ref: 'RefreshTokenSchema',
      required: true,
      type: mongoose.Schema.Types.ObjectId,
    },
    userId: { ref: 'UserSchema', required: true, type: mongoose.Schema.Types.ObjectId },
  },
  { collection: 'logins', timestamps: true },
);

LoginSchema.plugin(unsetPlugin);

LoginSchema.statics.createAccessAndRefreshTokens = async function (
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
};

LoginSchema.statics.mock = function (values: Partial<Login> = {}) {
  const defaults: Partial<Login> = { userId: new mongoose.Types.ObjectId() };

  return new this({ ...defaults, ...values });
};

export const LoginModel = mongoose.model<LoginDocument, LoginModelType>('LoginSchema', LoginSchema);

export { LoginSchema };

export default LoginModel;
