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

import { GameInvitation, GameInvitationDocument } from '../game-invitation';
import { Queue, QueueDocument } from '../queue';
import { RefreshTokenDocument } from '../refresh-token';
import { User, UserDocument } from '../user';
import { WebSocketEvent } from '../web-socket';

// Publish changes to Kafka.
export const QueueMemberEvent = new EventEmitter<IDatabasePayload<QueueMemberDocument>>();
QueueMemberEvent.on(payload => {
  kafka.publish(payload);
});

// Delete QueueMember when associated WebSocket is deleted.
WebSocketEvent.on(async payload => {
  if (payload.operationType !== 'delete') {
    return;
  }

  const queueMembers = await QueueMember.find({
    refreshTokenId: payload.fullDocument.refreshTokenId,
  });
  return Promise.all(queueMembers.map(qm => qm.remove()));
});

@index({ queueId: 1, userId: 1 }, { unique: true })
@index({ refreshTokenId: 1 })
@modelOptions({
  schemaOptions: {
    collection: 'queuemembers',
    minimize: false,
    timestamps: true,
  },
})
@plugin(changeStreamPlugin, {
  documentKeys: ['_id'],
  eventEmitter: QueueMemberEvent,
})
export class QueueMemberSchema {
  public _id: mongoose.Types.ObjectId;
  public createdAt: Date;

  @prop({ ref: 'QueueSchema', required: true })
  public queueId: Ref<QueueDocument>;

  @prop({ ref: 'RefreshTokenSchema', required: true })
  public refreshTokenId: Ref<RefreshTokenDocument>;

  @prop({ ref: 'UserSchema', required: true })
  public userId: Ref<UserDocument>;

  public updatedAt: Date;

  @prop({
    foreignField: 'userId',
    justOne: false,
    localField: 'userId',
    ref: 'GameInvitationSchema',
  })
  public gameInvitationDocuments: GameInvitationDocument[];

  @prop({ foreignField: '_id', justOne: true, localField: 'queueId', ref: 'QueueSchema' })
  public queueDocument: QueueDocument;

  @prop({ foreignField: '_id', justOne: true, localField: 'userId', ref: 'UserSchema' })
  public userDocument: UserDocument;
}

export type QueueMemberDocument = DocumentType<QueueMemberSchema>;
export type QueueMemberModel = ReturnModelType<typeof QueueMemberSchema>;
export const QueueMember = getModelForClass(QueueMemberSchema);
