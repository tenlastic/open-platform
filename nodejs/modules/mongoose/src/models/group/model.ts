import {
  DocumentType,
  getModelForClass,
  index,
  modelOptions,
  plugin,
  prop,
  PropType,
  ReturnModelType,
} from '@typegoose/typegoose';
import * as mongoose from 'mongoose';

import { duplicateKeyErrorPlugin } from '../../plugins';

@index(
  { name: 1 },
  {
    collation: { locale: 'en_US', strength: 1 },
    partialFilterExpression: { name: { $type: 'string' } },
    unique: true,
  },
)
@index({ userIds: 1 }, { unique: true })
@modelOptions({
  schemaOptions: {
    collation: { locale: 'en_US', strength: 1 },
    collection: 'groups',
    minimize: false,
    timestamps: true,
  },
})
@plugin(duplicateKeyErrorPlugin)
export class GroupSchema {
  public _id: mongoose.Types.ObjectId;
  public createdAt: Date;

  @prop({ type: Boolean })
  public isOpen: boolean;

  @prop({ maxlength: 24, type: String })
  public name: string;

  public updatedAt: Date;

  @prop({ ref: 'UserSchema', type: mongoose.Schema.Types.ObjectId }, PropType.ARRAY)
  public userIds: mongoose.Types.ObjectId[];

  /**
   * Creates a record with randomized required parameters if not specified.
   */
  public static mock(this: GroupModel, values: Partial<GroupSchema> = {}) {
    const defaults = {};

    return new this({ ...defaults, ...values });
  }
}

export type GroupDocument = DocumentType<GroupSchema>;
export type GroupModel = ReturnModelType<typeof GroupSchema>;
export const Group = getModelForClass(GroupSchema);
