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

import { EventEmitter, IDatabasePayload, changeStreamPlugin } from '../../change-stream';
import { RefreshToken, RefreshTokenDocument } from '../refresh-token';
import { UserDocument, UserEvent, UserPermissions } from '../user';

export const LoginEvent = new EventEmitter<IDatabasePayload<LoginDocument>>();

// Delete Logins if associated User is deleted.
UserEvent.sync(async (payload) => {
  switch (payload.operationType) {
    case 'delete':
      const records = await Login.find({ userId: payload.fullDocument._id });
      const promises = records.map((r) => r.remove());
      return Promise.all(promises);
  }
});

@index({ userId: 1 })
@modelOptions({
  schemaOptions: {
    collection: 'logins',
    minimize: false,
    timestamps: true,
  },
})
@plugin(changeStreamPlugin, { documentKeys: ['_id'], eventEmitter: LoginEvent })
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
  public static async createWithAccessAndRefreshTokens(
    parameters: Partial<LoginDocument>,
    user: UserDocument,
  ) {
    // Save the RefreshToken for renewal and revocation.
    const expiresAt = new Date(new Date().getTime() + 14 * 24 * 60 * 60 * 1000);

    let token: RefreshTokenDocument;
    if (parameters.refreshTokenId) {
      token = await RefreshToken.findOneAndUpdate(
        { _id: parameters.refreshTokenId, userId: user._id },
        { expiresAt, updatedAt: new Date() },
        { new: true },
      );
    } else {
      token = await RefreshToken.create({ expiresAt, userId: user._id });
    }

    // Remove unauthorized fields from the User.
    const filteredUser = await UserPermissions.read(user, user);

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

    const record = await Login.create({
      ...parameters,
      refreshTokenId: token._id,
      userId: user._id,
    });

    return { accessToken, record, refreshToken };
  }
}

export type LoginDocument = DocumentType<LoginSchema>;
export type LoginModel = ReturnModelType<typeof LoginSchema>;
export const Login = getModelForClass(LoginSchema);
