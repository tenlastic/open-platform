import * as mongoose from 'mongoose';

import {
  duplicateKeyErrorPlugin,
  ModifiedPlugin,
  modifiedPlugin,
  unsetPlugin,
} from '../../plugins';
import { AuthorizationDocument, AuthorizationRole } from '../authorization';

export interface AuthorizationRequest {
  _id: mongoose.Types.ObjectId;
  authorizationDocuments?: AuthorizationDocument[];
  createdAt?: Date;
  deniedAt?: Date;
  grantedAt?: Date;
  namespaceId?: mongoose.Types.ObjectId;
  roles?: AuthorizationRole[];
  updatedAt?: Date;
  userId: mongoose.Types.ObjectId;
  wasNew?: boolean;
}

export type AuthorizationRequestDocument = mongoose.Document<mongoose.Types.ObjectId> &
  AuthorizationRequest &
  ModifiedPlugin;

export interface AuthorizationRequestModelType
  extends mongoose.Model<AuthorizationRequestDocument> {
  /**
   * Creates a record with randomized required parameters if not specified.
   */
  mock(
    this: AuthorizationRequestModelType,
    values?: Partial<AuthorizationRequest>,
  ): AuthorizationRequestDocument;
}

const AuthorizationRequestSchema = new mongoose.Schema<
  AuthorizationRequestDocument,
  AuthorizationRequestModelType
>(
  {
    deniedAt: { filter: { create: true, update: true }, type: Date },
    grantedAt: { filter: { create: true, update: true }, type: Date },
    namespaceId: { ref: 'NamespaceSchema', type: mongoose.Schema.Types.ObjectId },
    roles: { enum: Object.values(AuthorizationRole), type: [String] },
    userId: { ref: 'UserSchema', required: true, type: mongoose.Schema.Types.ObjectId },
  },
  {
    collection: 'authorization-requests',
    timestamps: true,
  },
);

AuthorizationRequestSchema.index(
  { namespaceId: 1, userId: 1 },
  { partialFilterExpression: { deniedAt: null, grantedAt: null }, unique: true },
);

AuthorizationRequestSchema.index({ roles: 1 });

AuthorizationRequestSchema.plugin(duplicateKeyErrorPlugin);
AuthorizationRequestSchema.plugin(modifiedPlugin);
AuthorizationRequestSchema.plugin(unsetPlugin);

AuthorizationRequestSchema.virtual('authorizationDocuments', {
  foreignField: 'namespaceId',
  justOne: false,
  localField: 'namespaceId',
  ref: 'AuthorizationSchema',
});

AuthorizationRequestSchema.pre('validate', function (this: AuthorizationRequestDocument) {
  const deniedAtIsModified = this.isModified('deniedAt');
  const grantedAtIsModified = this.isModified('grantedAt');

  if (deniedAtIsModified && !this.deniedAt) {
    this.invalidate('deniedAt', new Error('Cannot unset deniedAt.'), this.deniedAt);
  }

  if (grantedAtIsModified && !this.grantedAt) {
    this.invalidate('grantedAt', new Error('Cannot unset grantedAt.'), this.grantedAt);
  }

  if (deniedAtIsModified && !grantedAtIsModified && this.deniedAt && this.grantedAt) {
    const message = 'Cannot set deniedAt if grantedAt is already set.';
    this.invalidate('deniedAt', new Error(message), this.deniedAt);
  }

  if (!deniedAtIsModified && grantedAtIsModified && this.deniedAt && this.grantedAt) {
    const message = 'Cannot set grantedAt if deniedAt is already set.';
    this.invalidate('grantedAt', new Error(message), this.grantedAt);
  }

  if (deniedAtIsModified && grantedAtIsModified && this.deniedAt && this.grantedAt) {
    const message = 'Cannot set deniedAt and grantedAt at the same time.';
    this.invalidate('deniedAt', new Error(message), this.deniedAt);
    this.invalidate('grantedAt', new Error(message), this.grantedAt);
  }
});

AuthorizationRequestSchema.statics.mock = function (values: Partial<AuthorizationRequest> = {}) {
  const defaults: Partial<AuthorizationRequest> = { userId: new mongoose.Types.ObjectId() };

  return new this({ ...defaults, ...values });
};

AuthorizationRequestSchema.methods.wasModified = function (
  this: AuthorizationRequestDocument,
  path?: string | string[],
) {
  if (typeof path === 'undefined') {
    return this.isModified();
  }

  if (Array.isArray(path)) {
    return this.isModified(path as string[]);
  }

  return this.isModified(path as string);
};

export const AuthorizationRequestModel = mongoose.model<
  AuthorizationRequestDocument,
  AuthorizationRequestModelType
>('AuthorizationRequestSchema', AuthorizationRequestSchema, 'authorization-requests');

export default AuthorizationRequestModel;
