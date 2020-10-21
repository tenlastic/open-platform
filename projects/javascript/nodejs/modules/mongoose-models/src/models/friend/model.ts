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

export const FriendEvent = new EventEmitter<IDatabasePayload<FriendDocument>>();
FriendEvent.on(payload => {
  kafka.publish(payload);
});

@index({ fromUserId: 1, toUserId: 1 }, { unique: true })
@modelOptions({
  schemaOptions: {
    autoIndex: true,
    collection: 'friends',
    minimize: false,
    timestamps: true,
  },
})
@plugin(changeStreamPlugin, {
  documentKeys: ['fromUserId', 'toUserId'],
  eventEmitter: FriendEvent,
})
export class FriendSchema {
  public _id: mongoose.Types.ObjectId;
  public createdAt: Date;

  @prop({ ref: 'UserSchema', required: true })
  public fromUserId: Ref<UserDocument>;

  @prop({ ref: 'UserSchema', required: true })
  public toUserId: Ref<UserDocument>;

  public updatedAt: Date;

  @prop({ foreignField: '_id', justOne: true, localField: 'fromUserId', ref: 'UserSchema' })
  public fromUserIdDocument: UserDocument;

  @prop({ foreignField: '_id', justOne: true, localField: 'toUserId', ref: 'UserSchema' })
  public toUserIdDocument: UserDocument;
}

export type FriendDocument = DocumentType<FriendSchema>;
export type FriendModel = ReturnModelType<typeof FriendSchema>;
export const Friend = getModelForClass(FriendSchema);
