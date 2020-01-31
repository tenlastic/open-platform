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

import { ReadonlyUser, ReadonlyUserDocument } from '../readonly-user';

export const IgnorationEvent = new EventEmitter<IDatabasePayload<IgnorationDocument>>();
IgnorationEvent.on(kafka.publish);

@index({ fromUserId: 1, toUserId: 1 }, { unique: true })
@modelOptions({
  schemaOptions: {
    autoIndex: true,
    collection: 'ignorations',
    minimize: false,
    timestamps: true,
  },
})
@plugin(changeStreamPlugin, {
  documentKeys: ['fromUserId', 'toUserId'],
  eventEmitter: IgnorationEvent,
})
export class IgnorationSchema {
  public _id: mongoose.Types.ObjectId;
  public createdAt: Date;

  @prop({ ref: ReadonlyUser, required: true })
  public fromUserId: Ref<ReadonlyUserDocument>;

  @prop({ ref: ReadonlyUser, required: true })
  public toUserId: Ref<ReadonlyUserDocument>;

  public updatedAt: Date;

  @prop({ foreignField: '_id', justOne: true, localField: 'fromUserId', ref: ReadonlyUser })
  public fromUserIdDocument: ReadonlyUserDocument;

  @prop({ foreignField: '_id', justOne: true, localField: 'toUserId', ref: ReadonlyUser })
  public toUserIdDocument: ReadonlyUserDocument;
}

export type IgnorationDocument = DocumentType<IgnorationSchema>;
export type IgnorationModel = ReturnModelType<typeof IgnorationSchema>;
export const Ignoration = getModelForClass(IgnorationSchema);
