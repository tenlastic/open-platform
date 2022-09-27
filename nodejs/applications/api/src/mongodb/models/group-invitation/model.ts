import { changeStreamPlugin, EventEmitter, IDatabasePayload } from '@tenlastic/mongoose-models';
import {
  DocumentType,
  ReturnModelType,
  getModelForClass,
  index,
  modelOptions,
  plugin,
  pre,
  prop,
} from '@typegoose/typegoose';
import * as mongoose from 'mongoose';

import { GroupDocument } from '../group';
import { UserDocument } from '../user';

export const OnGroupInvitationProduced = new EventEmitter<
  IDatabasePayload<GroupInvitationDocument>
>();

@index({ expiresAt: 1 }, { expireAfterSeconds: 0 })
@index({ fromUserId: 1 })
@index({ groupId: 1, toUserId: 1 }, { unique: true })
@modelOptions({
  schemaOptions: { collection: 'groupinvitations', minimize: false, timestamps: true },
})
@plugin(changeStreamPlugin, { documentKeys: ['_id'], eventEmitter: OnGroupInvitationProduced })
@pre('save', function (this: GroupInvitationDocument) {
  if (!this.isNew) {
    return;
  }

  // Set the expiration date to 1 minute in the future.
  const date = new Date();
  date.setTime(date.getTime() + 1 * 60 * 1000);
  this.expiresAt = date;
})
export class GroupInvitationSchema {
  public _id: mongoose.Types.ObjectId;
  public createdAt: Date;

  @prop()
  public expiresAt: Date;

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
