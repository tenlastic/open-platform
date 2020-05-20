import {
  DocumentType,
  Ref,
  ReturnModelType,
  getModelForClass,
  index,
  modelOptions,
  plugin,
  prop,
} from '@hasezoey/typegoose';
import {
  EventEmitter,
  IDatabasePayload,
  changeStreamPlugin,
} from '@tenlastic/mongoose-change-stream';
import * as kafka from '@tenlastic/mongoose-change-stream-kafka';
import * as mongoose from 'mongoose';

import { Group, GroupDocument } from '../group';
import { User, UserDocument } from '../user';

// Publish changes to Kafka.
export const GroupInvitationEvent = new EventEmitter<IDatabasePayload<GroupInvitationDocument>>();
GroupInvitationEvent.on(payload => {
  kafka.publish(payload);
});

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
    autoIndex: true,
    collection: 'groupinvitations',
    minimize: false,
    timestamps: true,
  },
})
@plugin(changeStreamPlugin, {
  documentKeys: ['_id'],
  eventEmitter: GroupInvitationEvent,
})
export class GroupInvitationSchema {
  public _id: mongoose.Types.ObjectId;
  public createdAt: Date;

  @prop({ ref: User, required: true })
  public fromUserId: Ref<UserDocument>;

  @prop({ ref: Group, required: true })
  public groupId: Ref<GroupDocument>;

  @prop({ ref: User, required: true })
  public toUserId: Ref<UserDocument>;

  public updatedAt: Date;

  @prop({ foreignField: '_id', justOne: true, localField: 'fromUserId', ref: User })
  public fromUserDocument: UserDocument;

  @prop({ foreignField: '_id', justOne: true, localField: 'groupId', ref: Group })
  public groupDocument: GroupDocument;

  @prop({ foreignField: '_id', justOne: true, localField: 'toUserId', ref: User })
  public toUserDocument: UserDocument;
}

export type GroupInvitationDocument = DocumentType<GroupInvitationSchema>;
export type GroupInvitationModel = ReturnModelType<typeof GroupInvitationSchema>;
export const GroupInvitation = getModelForClass(GroupInvitationSchema);
