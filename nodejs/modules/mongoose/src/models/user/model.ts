import * as bcrypt from 'bcryptjs';
import { Chance } from 'chance';
import * as mongoose from 'mongoose';

import { collation } from '../../constants';
import { duplicateKeyErrorPlugin, unsetPlugin } from '../../plugins';
import { alphanumericValidator, emailValidator } from '../../validators';
import { AuthorizationDocument } from '../authorization';

export interface User {
  _id: mongoose.Types.ObjectId;
  authorizationDocument?: AuthorizationDocument;
  createdAt?: Date;
  email?: string;
  password?: string;
  steamId?: string;
  steamPersonaName?: string;
  updatedAt?: Date;
  username?: string;
}

export interface UserDocument extends mongoose.Document<mongoose.Types.ObjectId>, User {
  /**
   * Checks if a plaintext password is valid.
   */
  isValidPassword(this: UserDocument, plaintext: string): Promise<boolean>;
}

export interface UserModelType extends mongoose.Model<UserDocument> {
  /**
   * Hashes a plaintext password.
   */
  hashPassword(this: UserModelType, plaintext: string): Promise<string>;

  /**
   * Creates a record with randomized required parameters if not specified.
   */
  mock(this: UserModelType, values?: Partial<User>): UserDocument;
}

const UserSchema = new mongoose.Schema<UserDocument, UserModelType>(
  {
    email: {
      lowercase: true,
      maxlength: 256,
      trim: true,
      type: String,
      validate: [emailValidator],
    },
    password: { type: String },
    steamId: { maxlength: 64, trim: true, type: String },
    steamPersonaName: { maxlength: 128, trim: true, type: String },
    username: { maxlength: 24, trim: true, type: String, validate: alphanumericValidator },
  },
  { collection: 'users', collation, timestamps: true },
);

UserSchema.index(
  { email: 1 },
  { partialFilterExpression: { email: { $exists: true } }, unique: true },
);
UserSchema.index(
  { steamId: 1 },
  { partialFilterExpression: { steamId: { $exists: true } }, unique: true },
);
UserSchema.index(
  { username: 1 },
  { collation, partialFilterExpression: { username: { $exists: true } }, unique: true },
);

UserSchema.plugin(duplicateKeyErrorPlugin);
UserSchema.plugin(unsetPlugin);

UserSchema.pre('save', async function (this: UserDocument) {
  if (this.isModified('password')) {
    this.password = await UserModel.hashPassword(this.password);
  }
});

UserSchema.pre('validate', function (this: UserDocument) {
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
});

UserSchema.virtual('authorizationDocument', {
  ref: 'AuthorizationSchema',
  localField: '_id',
  foreignField: 'userId',
  justOne: true,
  match: { namespaceId: { $exists: false } },
});

UserSchema.statics.hashPassword = async function (plaintext: string) {
  const salt = await bcrypt.genSalt(8);
  return bcrypt.hash(plaintext, salt);
};

UserSchema.statics.mock = function (values: Partial<User> = {}) {
  const chance = new Chance();
  const defaults = {
    email: chance.email(),
    password: chance.hash(),
    username: chance.hash({ length: 24 }),
  };

  return new this({ ...defaults, ...values });
};

UserSchema.methods.isValidPassword = function (this: UserDocument, plaintext: string) {
  return bcrypt.compare(plaintext, this.password);
};

export const UserModel = mongoose.model<UserDocument, UserModelType>('UserSchema', UserSchema);

export { UserSchema };

export default UserModel;
