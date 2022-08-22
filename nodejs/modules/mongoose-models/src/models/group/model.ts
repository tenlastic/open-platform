import {
  DocumentType,
  ReturnModelType,
  getModelForClass,
  index,
  modelOptions,
  plugin,
  prop,
} from '@typegoose/typegoose';
import * as mongoose from 'mongoose';

import { changeStreamPlugin, EventEmitter, IDatabasePayload } from '../../change-stream';

export const OnGroupProduced = new EventEmitter<IDatabasePayload<GroupDocument>>();

@index({ userIds: 1 }, { unique: true })
@modelOptions({ schemaOptions: { collection: 'groups', minimize: false, timestamps: true } })
@plugin(changeStreamPlugin, { documentKeys: ['_id'], eventEmitter: OnGroupProduced })
export class GroupSchema {
  public _id: mongoose.Types.ObjectId;
  public createdAt: Date;

  @prop({ default: false })
  public isOpen: boolean;

  public updatedAt: Date;

  @prop({ ref: 'UserSchema', type: new mongoose.Types.ObjectId() })
  public userIds: mongoose.Types.ObjectId[];

  public get userCount() {
    return this.userIds.length;
  }
}

export type GroupDocument = DocumentType<GroupSchema>;
export type GroupModel = ReturnModelType<typeof GroupSchema>;
export const Group = getModelForClass(GroupSchema);
