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

import { EventEmitter, IDatabasePayload, changeStreamPlugin } from '../../change-stream';
import { GroupDocument } from '../group';
import { UserDocument } from '../user';

export const GroupInvitationEvent = new EventEmitter<IDatabasePayload<GroupInvitationDocument>>();

// Delete stale GroupInvitations.
setInterval(async () => {
  const date = new Date();
  date.setSeconds(date.getSeconds() - 60);

  const groupInvitations = await GroupInvitation.find({ createdAt: { $lt: date } });
  for (const groupInvitation of groupInvitations) {
    await groupInvitation.remove();
  }
}, 15000);

@index({ fromUserId: 1 })
@index({ groupId: 1, toUserId: 1 }, { unique: true })
@modelOptions({
  schemaOptions: {
    collection: 'groupinvitations',
    minimize: false,
    timestamps: true,
  },
})
@plugin(changeStreamPlugin, { documentKeys: ['_id'], eventEmitter: GroupInvitationEvent })
export class GroupInvitationSchema {
  public _id: mongoose.Types.ObjectId;
  public createdAt: Date;

  @prop({ immutable: true, ref: 'UserSchema', required: true })
  public fromUserId: mongoose.Types.ObjectId;

  @prop({ immutable: true, ref: 'GroupSchema', required: true })
  public groupId: mongoose.Types.ObjectId;

  @prop({ immutable: true, ref: 'UserSchema', required: true })
  public toUserId: mongoose.Types.ObjectId;

  public updatedAt: Date;

  @prop({ foreignField: '_id', justOne: true, localField: 'fromUserId', ref: 'UserSchema' })
  public fromUserDocument: UserDocument;

  @prop({ foreignField: '_id', justOne: true, localField: 'groupId', ref: 'GroupSchema' })
  public groupDocument: GroupDocument;

  @prop({ foreignField: '_id', justOne: true, localField: 'toUserId', ref: 'UserSchema' })
  public toUserDocument: UserDocument;
}

export type GroupInvitationDocument = DocumentType<GroupInvitationSchema>;
export type GroupInvitationModel = ReturnModelType<typeof GroupInvitationSchema>;
export const GroupInvitation = getModelForClass(GroupInvitationSchema);
