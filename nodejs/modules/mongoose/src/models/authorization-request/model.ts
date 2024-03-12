import {
  DocumentType,
  getModelForClass,
  index,
  modelOptions,
  plugin,
  pre,
  prop,
  PropType,
} from '@typegoose/typegoose';
import * as mongoose from 'mongoose';

import {
  duplicateKeyErrorPlugin,
  ModifiedPlugin,
  modifiedPlugin,
  unsetPlugin,
} from '../../plugins';
import { AuthorizationDocument, AuthorizationRole } from '../authorization';

@index(
  { namespaceId: 1, userId: 1 },
  { partialFilterExpression: { deniedAt: null, grantedAt: null }, unique: true },
)
@index({ roles: 1 })
@modelOptions({ schemaOptions: { collection: 'authorization-requests', timestamps: true } })
@plugin(duplicateKeyErrorPlugin)
@plugin(modifiedPlugin)
@plugin(unsetPlugin)
@pre('validate', function (this: AuthorizationRequestDocument) {
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
})
export class AuthorizationRequestSchema implements ModifiedPlugin {
  public _id: mongoose.Types.ObjectId;

  public createdAt: Date;

  @prop({ filter: { create: true, update: true }, type: Date })
  public deniedAt: Date;

  @prop({ filter: { create: true, update: true }, type: Date })
  public grantedAt: Date;

  @prop({ ref: 'NamespaceSchema', type: mongoose.Schema.Types.ObjectId })
  public namespaceId: mongoose.Types.ObjectId;

  @prop({ enum: AuthorizationRole, type: String }, PropType.ARRAY)
  public roles: AuthorizationRole[];

  public updatedAt: Date;

  @prop({ ref: 'UserSchema', required: true, type: mongoose.Schema.Types.ObjectId })
  public userId: mongoose.Types.ObjectId;

  public wasNew: boolean;

  @prop({ foreignField: 'namespaceId', localField: 'namespaceId', ref: 'AuthorizationSchema' })
  public authorizationDocuments: AuthorizationDocument[];

  /**
   * Creates a record with randomized required parameters if not specified.
   */
  public static mock(
    this: typeof AuthorizationRequestModel,
    values: Partial<AuthorizationRequestSchema> = {},
  ) {
    const defaults = { userId: new mongoose.Types.ObjectId() };

    return new this({ ...defaults, ...values });
  }

  /**
   * Returns true if any of the path or paths were modified.
   */
  public wasModified: (path?: string | string[]) => boolean;
}

export type AuthorizationRequestDocument = DocumentType<AuthorizationRequestSchema>;
export const AuthorizationRequestModel = getModelForClass(AuthorizationRequestSchema);
