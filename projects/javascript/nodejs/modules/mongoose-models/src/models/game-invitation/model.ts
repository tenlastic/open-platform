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
import { plugin as uniqueErrorPlugin } from '@tenlastic/mongoose-unique-error';
import * as mongoose from 'mongoose';

import { namespaceValidator } from '../../validators';
import { GameDocument, GameEvent } from '../game';
import { NamespaceDocument, NamespaceEvent } from '../namespace';
import { UserDocument } from '../user';

export const GameInvitationEvent = new EventEmitter<IDatabasePayload<GameInvitationDocument>>();

// Publish changes to Kafka.
GameInvitationEvent.sync(kafka.publish);

// Delete Game Invitations if associated Game is deleted.
GameEvent.sync(async payload => {
  switch (payload.operationType) {
    case 'delete':
      const records = await GameInvitation.find({ gameId: payload.fullDocument._id });
      const promises = records.map(r => r.remove());
      return Promise.all(promises);
  }
});

// Delete Game Invitations if associated Namespace is deleted.
NamespaceEvent.sync(async payload => {
  switch (payload.operationType) {
    case 'delete':
      const records = await GameInvitation.find({ namespaceId: payload.fullDocument._id });
      const promises = records.map(r => r.remove());
      return Promise.all(promises);
  }
});

@index({ gameId: 1, namespaceId: 1, userId: 1 }, { unique: true })
@modelOptions({
  schemaOptions: {
    collection: 'gameinvitations',
    minimize: false,
    timestamps: true,
  },
})
@plugin(changeStreamPlugin, { documentKeys: ['_id'], eventEmitter: GameInvitationEvent })
@plugin(uniqueErrorPlugin)
export class GameInvitationSchema {
  public _id: mongoose.Types.ObjectId;
  public createdAt: Date;

  @prop({
    ref: 'GameSchema',
    required: true,
    validate: namespaceValidator('gameDocument', 'gameId'),
  })
  public gameId: Ref<GameDocument>;

  @prop({ ref: 'NamespaceSchema', required: true })
  public namespaceId: Ref<NamespaceDocument>;

  public updatedAt: Date;

  @prop({ ref: 'UserSchema', required: true })
  public userId: Ref<UserDocument>;

  @prop({ foreignField: '_id', justOne: true, localField: 'gameId', ref: 'GameSchema' })
  public gameDocument: GameDocument;

  @prop({ foreignField: '_id', justOne: true, localField: 'namespaceId', ref: 'NamespaceSchema' })
  public namespaceDocument: NamespaceDocument;

  @prop({ foreignField: '_id', justOne: true, localField: 'userId', ref: 'UserSchema' })
  public userDocument: UserDocument;
}

export type GameInvitationDocument = DocumentType<GameInvitationSchema>;
export type GameInvitationModel = ReturnModelType<typeof GameInvitationSchema>;
export const GameInvitation = getModelForClass(GameInvitationSchema);
