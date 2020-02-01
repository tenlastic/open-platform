import {
  DocumentType,
  Ref,
  ReturnModelType,
  arrayProp,
  getModelForClass,
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

import { ReadonlyUser, ReadonlyUserDocument } from '../readonly-user';

export const MessageEvent = new EventEmitter<IDatabasePayload<MessageDocument>>();
MessageEvent.on(kafka.publish);

@modelOptions({
  schemaOptions: {
    autoIndex: true,
    collection: 'messages',
    minimize: false,
    timestamps: true,
  },
})
@plugin(changeStreamPlugin, {
  documentKeys: ['_id'],
  eventEmitter: MessageEvent,
})
export class MessageSchema {
  public _id: mongoose.Types.ObjectId;

  @prop({ maxlength: 512, required: true })
  public body: string;

  @prop({ ref: ReadonlyUser, required: true })
  public fromUserId: Ref<ReadonlyUserDocument>;

  @arrayProp({ itemsRef: ReadonlyUser, required: true })
  public toUserIds: Array<Ref<ReadonlyUserDocument>>;

  public updatedAt: Date;

  @prop({ foreignField: '_id', justOne: true, localField: 'fromUserId', ref: ReadonlyUser })
  public fromUserDocument: ReadonlyUserDocument;

  @arrayProp({
    foreignField: '_id',
    justOne: false,
    localField: 'toUserIds',
    ref: ReadonlyUser,
  })
  public toUserDocuments: ReadonlyUserDocument[];
}

export type MessageDocument = DocumentType<MessageSchema>;
export type MessageModel = ReturnModelType<typeof MessageSchema>;
export const Message = getModelForClass(MessageSchema);
