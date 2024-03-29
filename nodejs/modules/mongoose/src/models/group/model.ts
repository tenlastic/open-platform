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

@index(
  { name: 1 },
  { collation, partialFilterExpression: { name: { $exists: true } }, unique: true },
)
@index({ userIds: 1 }, { unique: true })
@modelOptions({ schemaOptions: { collation, collection: 'groups', timestamps: true } })
@plugin(duplicateKeyErrorPlugin)
@plugin(unsetPlugin)
export class GroupSchema {
  public _id: mongoose.Types.ObjectId;
  public createdAt: Date;

  @prop({ maxlength: 24, trim: true, type: String })
  public name: string;

  @prop({ type: Boolean })
  public open: boolean;

  public updatedAt: Date;

  @prop({ ref: 'UserSchema', type: mongoose.Schema.Types.ObjectId }, PropType.ARRAY)
  public userIds: mongoose.Types.ObjectId[];

  /**
   * Creates a record with randomized required parameters if not specified.
   */
  public static mock(this: typeof GroupModel, values: Partial<GroupSchema> = {}) {
    const defaults = {};

    return new this({ ...defaults, ...values });
  }
}

export type GroupDocument = DocumentType<GroupSchema>;
export const GroupModel = getModelForClass(GroupSchema);
