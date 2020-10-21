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

import { Namespace, NamespaceDocument } from '../namespace';
import { User, UserDocument } from '../user';

// Publish changes to Kafka.
export const GameInvitationEvent = new EventEmitter<IDatabasePayload<GameInvitationDocument>>();
GameInvitationEvent.on(payload => {
  kafka.publish(payload);
});

@index({ fromUserId: 1 })
@index({ namespaceId: 1, toUserId: 1 }, { unique: true })
@modelOptions({
  schemaOptions: {
    autoIndex: true,
    collection: 'gameinvitations',
    minimize: false,
    timestamps: true,
  },
})
@plugin(changeStreamPlugin, {
  documentKeys: ['_id'],
  eventEmitter: GameInvitationEvent,
})
export class GameInvitationSchema {
  public _id: mongoose.Types.ObjectId;
  public createdAt: Date;

  @prop({ ref: 'UserSchema', required: true })
  public fromUserId: Ref<UserDocument>;

  @prop({ ref: 'NamespaceSchema', required: true })
  public namespaceId: Ref<NamespaceDocument>;

  @prop({ ref: 'UserSchema', required: true })
  public toUserId: Ref<UserDocument>;

  public updatedAt: Date;

  @prop({ foreignField: '_id', justOne: true, localField: 'fromUserId', ref: 'UserSchema' })
  public fromUserDocument: UserDocument;

  @prop({ foreignField: '_id', justOne: true, localField: 'namespaceId', ref: 'NamespaceSchema' })
  public namespaceDocument: NamespaceDocument;

  @prop({ foreignField: '_id', justOne: true, localField: 'toUserId', ref: 'UserSchema' })
  public toUserDocument: UserDocument;
}

export type GameInvitationDocument = DocumentType<GameInvitationSchema>;
export type GameInvitationModel = ReturnModelType<typeof GameInvitationSchema>;
export const GameInvitation = getModelForClass(GameInvitationSchema);
