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

import { User, UserDocument } from '../user';

export const IgnorationEvent = new EventEmitter<IDatabasePayload<IgnorationDocument>>();

// Publish changes to Kafka.
IgnorationEvent.on(payload => {
  kafka.publish(payload);
});

@index({ fromUserId: 1, toUserId: 1 }, { unique: true })
@modelOptions({
  schemaOptions: {
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

  @prop({ immutable: true, ref: 'UserSchema', required: true })
  public fromUserId: Ref<UserDocument>;

  @prop({ immutable: true, ref: 'UserSchema', required: true })
  public toUserId: Ref<UserDocument>;

  public updatedAt: Date;

  @prop({ foreignField: '_id', justOne: true, localField: 'fromUserId', ref: 'UserSchema' })
  public fromUserIdDocument: UserDocument;

  @prop({ foreignField: '_id', justOne: true, localField: 'toUserId', ref: 'UserSchema' })
  public toUserIdDocument: UserDocument;
}

export type IgnorationDocument = DocumentType<IgnorationSchema>;
export type IgnorationModel = ReturnModelType<typeof IgnorationSchema>;
export const Ignoration = getModelForClass(IgnorationSchema);
