import {
  DocumentType,
  ReturnModelType,
  arrayProp,
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

import { GroupDocument } from '../group';
import { User, UserDocument } from '../user';

export const MessageEvent = new EventEmitter<IDatabasePayload<MessageDocument>>();

// Publish changes to Kafka.
MessageEvent.on(payload => {
  kafka.publish(payload);
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
export class MessageSchema {
  public _id: mongoose.Types.ObjectId;

  @prop({ maxlength: 512, required: true })
  public body: string;

  @prop({ immutable: true, required: true })
  public fromUserId: mongoose.Types.ObjectId;

  @arrayProp({ items: mongoose.Types.ObjectId })
  public readByUserIds: mongoose.Types.ObjectId[];

  @prop({
    immutable: true,
    required(this: MessageDocument) {
      return !this.toUserId;
    },
  })
  public toGroupId: mongoose.Types.ObjectId;

  @prop({
    immutable: true,
    required(this: MessageDocument) {
      return !this.toGroupId;
    },
  })
  public toUserId: mongoose.Types.ObjectId;

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
