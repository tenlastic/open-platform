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
import { UserDocument } from '../user';

export const OnFriendProduced = new EventEmitter<IDatabasePayload<FriendDocument>>();

@index({ fromUserId: 1, toUserId: 1 }, { unique: true })
@modelOptions({ schemaOptions: { collection: 'friends', minimize: false, timestamps: true } })
@plugin(changeStreamPlugin, {
  documentKeys: ['fromUserId', 'toUserId'],
  eventEmitter: OnFriendProduced,
})
export class FriendSchema {
  public _id: mongoose.Types.ObjectId;
  public createdAt: Date;

  @prop({ immutable: true, ref: 'UserSchema', required: true })
  public fromUserId: mongoose.Types.ObjectId;

  @prop({ immutable: true, ref: 'UserSchema', required: true })
  public toUserId: mongoose.Types.ObjectId;

  public updatedAt: Date;

  @prop({ foreignField: '_id', justOne: true, localField: 'fromUserId', ref: 'UserSchema' })
  public fromUserIdDocument: UserDocument;

  @prop({ foreignField: '_id', justOne: true, localField: 'toUserId', ref: 'UserSchema' })
  public toUserIdDocument: UserDocument;
}

export type FriendDocument = DocumentType<FriendSchema>;
export type FriendModel = ReturnModelType<typeof FriendSchema>;
export const Friend = getModelForClass(FriendSchema);
