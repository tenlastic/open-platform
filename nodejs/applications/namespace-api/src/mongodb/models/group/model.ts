import {
  DocumentType,
  getModelForClass,
  index,
  modelOptions,
  prop,
  PropType,
  ReturnModelType,
} from '@typegoose/typegoose';
import * as mongoose from 'mongoose';

@index({ userIds: 1 })
@modelOptions({ schemaOptions: { collection: 'groups', minimize: false, timestamps: true } })
export class GroupSchema {
  public _id: mongoose.Types.ObjectId;
  public createdAt: Date;

  @prop({ default: false, type: Boolean })
  public isOpen: boolean;

  public updatedAt: Date;

  @prop({ ref: 'UserSchema', type: mongoose.Schema.Types.ObjectId }, PropType.ARRAY)
  public userIds: mongoose.Types.ObjectId[];

  public get userCount() {
    return this.userIds.length;
  }
}

export type GroupDocument = DocumentType<GroupSchema>;
export type GroupModel = ReturnModelType<typeof GroupSchema>;
export const Group = getModelForClass(GroupSchema);
