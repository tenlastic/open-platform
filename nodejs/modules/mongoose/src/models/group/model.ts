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

import { collation } from '../../constants';
import { duplicateKeyErrorPlugin, unsetPlugin } from '../../plugins';
import { arrayNullUndefinedValidator } from '../../validators';
import { AuthorizationDocument } from '../authorization';

@index(
  { name: 1, namespaceId: 1 },
  { collation, partialFilterExpression: { name: { $exists: true } }, unique: true },
)
@index({ namespaceId: 1, userIds: 1 }, { unique: true })
@modelOptions({ schemaOptions: { collation, collection: 'groups', timestamps: true } })
@plugin(duplicateKeyErrorPlugin)
@plugin(unsetPlugin)
@pre('validate', function (this: GroupDocument) {
  if (this.userIds.length > 0 && !this.userIds.some((ui) => ui.equals(this.userId))) {
    const message = 'User IDs must include the User ID.';
    this.invalidate('userId', message, this.userId);
  }
})
export class GroupSchema {
  public _id: mongoose.Types.ObjectId;
  public createdAt: Date;

  @prop({ ref: 'NamespaceSchema', required: true, type: mongoose.Schema.Types.ObjectId })
  public namespaceId: mongoose.Types.ObjectId;

  public updatedAt: Date;

  @prop({ ref: 'UserSchema', required: true, type: mongoose.Schema.Types.ObjectId })
  public userId: mongoose.Types.ObjectId;

  @prop(
    {
      ref: 'UserSchema',
      required: true,
      type: mongoose.Schema.Types.ObjectId,
      validate: [arrayNullUndefinedValidator],
    },
    PropType.ARRAY,
  )
  public userIds: mongoose.Types.ObjectId[];

  @prop({ foreignField: 'namespaceId', localField: 'namespaceId', ref: 'AuthorizationSchema' })
  public authorizationDocuments: AuthorizationDocument[];

  /**
   * Creates a record with randomized required parameters if not specified.
   */
  public static mock(this: typeof GroupModel, values: Partial<GroupSchema> = {}) {
    const userId = new mongoose.Types.ObjectId();

    const defaults = {
      namespaceId: new mongoose.Types.ObjectId(),
      userId,
      userIds: [userId],
    };

    return new this({ ...defaults, ...values });
  }
}

export type GroupDocument = DocumentType<GroupSchema>;
export const GroupModel = getModelForClass(GroupSchema);
