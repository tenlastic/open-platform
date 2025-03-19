import {
  DocumentType,
  getModelForClass,
  index,
  modelOptions,
  plugin,
  prop,
  PropType,
} from '@typegoose/typegoose';
import * as mongoose from 'mongoose';

import { collation } from '../../constants';
import { duplicateKeyErrorPlugin, unsetPlugin } from '../../plugins';
import { arrayLengthValidator, arrayNullUndefinedValidator } from '../../validators';
import { GroupMemberDocument, GroupMemberModel, GroupMemberSchema } from './member';
import { AuthorizationDocument } from '../authorization';

@index(
  { name: 1, namespaceId: 1 },
  { collation, partialFilterExpression: { name: { $exists: true } }, unique: true },
)
@index({ 'members.userId': 1, namespaceId: 1 }, { unique: true })
@modelOptions({ schemaOptions: { collation, collection: 'groups', timestamps: true } })
@plugin(duplicateKeyErrorPlugin)
@plugin(unsetPlugin)
export class GroupSchema {
  public _id: mongoose.Types.ObjectId;
  public createdAt: Date;

  @prop(
    {
      required: true,
      type: GroupMemberSchema,
      validate: [arrayLengthValidator(Infinity, 1), arrayNullUndefinedValidator],
    },
    PropType.ARRAY,
  )
  public members: GroupMemberDocument[];

  @prop({ ref: 'NamespaceSchema', required: true, type: mongoose.Schema.Types.ObjectId })
  public namespaceId: mongoose.Types.ObjectId;

  public updatedAt: Date;

  @prop({ foreignField: 'namespaceId', localField: 'namespaceId', ref: 'AuthorizationSchema' })
  public authorizationDocuments: AuthorizationDocument[];

  /**
   * Creates a record with randomized required parameters if not specified.
   */
  public static mock(this: typeof GroupModel, values: Partial<GroupSchema> = {}) {
    const defaults = {
      members: [GroupMemberModel.mock()],
      namespaceId: new mongoose.Types.ObjectId(),
    };

    return new this({ ...defaults, ...values });
  }
}

export type GroupDocument = DocumentType<GroupSchema>;
export const GroupModel = getModelForClass(GroupSchema);
