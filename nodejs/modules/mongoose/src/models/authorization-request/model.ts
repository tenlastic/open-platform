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

@index({ namespaceId: 1, userId: 1 }, { unique: true })
@index({ roles: 1 })
@modelOptions({ schemaOptions: { collection: 'authorization-requests', timestamps: true } })
@plugin(duplicateKeyErrorPlugin)
@plugin(modifiedPlugin)
@plugin(unsetPlugin)
@pre('save', function (this: AuthorizationRequestDocument) {
  if (this.deniedAt && this.isModified('deniedAt')) {
    this.grantedAt = undefined;
  }

  if (this.isModified('grantedAt') && this.grantedAt) {
    this.deniedAt = undefined;
  }

  if (this.isModified('roles')) {
    this.deniedAt = undefined;
    this.grantedAt = undefined;
  }
})
@pre('validate', function (this: AuthorizationRequestDocument) {
  if (this.isModified('deniedAt') && this.isModified('grantedAt')) {
    this.invalidate(
      'deniedAt',
      new Error('Cannot modify deniedAt and grantedAt at once.'),
      this.deniedAt,
    );
    this.invalidate(
      'grantedAt',
      new Error('Cannot modify deniedAt and grantedAt at once.'),
      this.grantedAt,
    );
  }

  this.validateRoles();
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
   * Merges roles between the Authorization and Authorization Request.
   */
  public mergeRoles(this: AuthorizationRequestDocument, authorization: AuthorizationDocument) {
    const priorities = [
      AuthorizationRole.ArticlesReadPublished,
      AuthorizationRole.ArticlesRead,
      AuthorizationRole.ArticlesReadWrite,
      AuthorizationRole.AuthorizationsRead,
      AuthorizationRole.AuthorizationsReadWrite,
      AuthorizationRole.BuildsReadPublished,
      AuthorizationRole.BuildsRead,
      AuthorizationRole.BuildsReadWrite,
      AuthorizationRole.CollectionsRead,
      AuthorizationRole.CollectionsReadWrite,
      AuthorizationRole.GameServersRead,
      AuthorizationRole.GameServersReadWrite,
      AuthorizationRole.LoginsRead,
      AuthorizationRole.NamespacesRead,
      AuthorizationRole.NamespacesReadWrite,
      AuthorizationRole.QueuesRead,
      AuthorizationRole.QueuesReadWrite,
      AuthorizationRole.RecordsRead,
      AuthorizationRole.RecordsReadWrite,
      AuthorizationRole.StorefrontsRead,
      AuthorizationRole.StorefrontsReadWrite,
      AuthorizationRole.UsersRead,
      AuthorizationRole.UsersReadWrite,
      AuthorizationRole.WebSocketsRead,
      AuthorizationRole.WebSocketsReadWrite,
      AuthorizationRole.WorkflowsRead,
      AuthorizationRole.WorkflowsReadWrite,
    ];
    const result = [...authorization.roles];

    for (const role of this.roles) {
      const [prefix] = role.split(':');

      const current = result.find((r) => r.startsWith(`${prefix}:`));
      if (!current) {
        result.push(role);
        continue;
      }

      const currentPriority = priorities.indexOf(current);
      const priority = priorities.indexOf(role);
      if (currentPriority >= priority) {
        continue;
      }

      const i = result.indexOf(current);
      result[i] = role;
    }

    return result.sort();
  }

  /**
   * Returns true if any of the path or paths were modified.
   */
  public wasModified: (path?: string | string[]) => boolean;

  /**
   * Allows only one role per entity.
   */
  private validateRoles(this: AuthorizationRequestDocument) {
    const set = new Set<string>();

    for (const role of this.roles) {
      const [entity] = role.split(':');

      if (set.has(entity)) {
        this.invalidate('roles', 'Only one role can be set per entity.', role, 'DuplicateRole');
      } else {
        set.add(entity);
      }
    }
  }
}

export type AuthorizationRequestDocument = DocumentType<AuthorizationRequestSchema>;
export const AuthorizationRequestModel = getModelForClass(AuthorizationRequestSchema);
