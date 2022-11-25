import { duplicateKeyErrorPlugin } from '@tenlastic/mongoose-models';
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

@index({ name: 1 }, { partialFilterExpression: { name: { $type: 'string' } }, unique: true })
@index({ userIds: 1 }, { unique: true })
@modelOptions({ schemaOptions: { collection: 'groups', minimize: false, timestamps: true } })
@plugin(duplicateKeyErrorPlugin)
export class GroupSchema {
  public _id: mongoose.Types.ObjectId;
  public createdAt: Date;

  @prop({ default: false, type: Boolean })
  public isOpen: boolean;

  @prop({ maxlength: 24, type: String })
  public name: string;

  public updatedAt: Date;

  @prop({ ref: 'UserSchema', type: mongoose.Schema.Types.ObjectId }, PropType.ARRAY)
  public userIds: mongoose.Types.ObjectId[];
}

export type GroupDocument = DocumentType<GroupSchema>;
export type GroupModel = ReturnModelType<typeof GroupSchema>;
export const Group = getModelForClass(GroupSchema);
