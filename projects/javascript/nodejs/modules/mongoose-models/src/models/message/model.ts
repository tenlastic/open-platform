import {
  DocumentType,
  Ref,
  ReturnModelType,
  arrayProp,
  getModelForClass,
  index,
  modelOptions,
  plugin,
  pre,
  prop,
} from '@typegoose/typegoose';
import {
  EventEmitter,
  IDatabasePayload,
  changeStreamPlugin,
} from '@tenlastic/mongoose-change-stream';
import * as mongoose from 'mongoose';

import { GroupDocument, GroupEvent } from '../group';
import { UserDocument, UserEvent } from '../user';

export const MessageEvent = new EventEmitter<IDatabasePayload<MessageDocument>>();

// Delete Messages if associated Group is deleted.
GroupEvent.sync(async payload => {
  const group = payload.fullDocument;

  if (payload.operationType === 'delete') {
    const records = await Message.find({ groupId: group._id });
    const promises = records.map(r => r.remove());
    return Promise.all(promises);
  } else if (payload.operationType === 'update') {
    const records = await Message.find({ fromUserId: { $nin: group.userIds }, groupId: group._id });
    const promises = records.map(r => r.remove());
    return Promise.all(promises);
  }
});

// Delete Messages if associated User is deleted.
UserEvent.sync(async payload => {
  switch (payload.operationType) {
    case 'delete':
      const records = await Message.find({
        $or: [{ fromUserId: payload.fullDocument._id }, { toUserId: payload.fullDocument._id }],
      });
      const promises = records.map(r => r.remove());
      return Promise.all(promises);
  }
});

@index({ fromUserId: 1 })
@index({ readByUserIds: 1 })
@index({ toGroupId: 1 })
@index({ toUserId: 1 })
@modelOptions({
  schemaOptions: {
    collection: 'messages',
    minimize: false,
    timestamps: true,
  },
})
@plugin(changeStreamPlugin, { documentKeys: ['_id'], eventEmitter: MessageEvent })
@pre('validate', function(this: MessageDocument) {
  const message = 'Only one of the following fields must be specified: toGroupId or toUserId.';

  if (this.toGroupId && this.toUserId) {
    this.invalidate('toGroupId', message, this.toGroupId);
    this.invalidate('toUserId', message, this.toUserId);
  } else if (!this.toGroupId && !this.toUserId) {
    this.invalidate('toGroupId', message, this.toGroupId);
    this.invalidate('toUserId', message, this.toUserId);
  }
})
export class MessageSchema {
  public _id: mongoose.Types.ObjectId;

  @prop({ maxlength: 512, required: true })
  public body: string;

  public createdAt: Date;

  @prop({ immutable: true, ref: 'UserSchema', required: true })
  public fromUserId: Ref<UserDocument>;

  @arrayProp({ itemsRef: 'UserSchema' })
  public readByUserIds: Array<Ref<UserDocument>>;

  @prop({ immutable: true, ref: 'GroupSchema' })
  public toGroupId: Ref<GroupDocument>;

  @prop({ immutable: true, ref: 'UserSchema' })
  public toUserId: Ref<UserDocument>;

  public updatedAt: Date;

  @prop({ foreignField: '_id', justOne: true, localField: 'fromUserId', ref: 'UserSchema' })
  public fromUserDocument: UserDocument;

  @prop({ foreignField: '_id', justOne: true, localField: 'toGroupId', ref: 'GroupSchema' })
  public toGroupDocument: GroupDocument;

  @prop({ foreignField: '_id', justOne: true, localField: 'toUserId', ref: 'UserSchema' })
  public toUserDocument: UserDocument;
}

export type MessageDocument = DocumentType<MessageSchema>;
export type MessageModel = ReturnModelType<typeof MessageSchema>;
export const Message = getModelForClass(MessageSchema);
