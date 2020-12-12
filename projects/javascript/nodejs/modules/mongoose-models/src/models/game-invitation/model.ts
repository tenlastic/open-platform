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

import { NamespaceDocument, NamespaceEvent } from '../namespace';
import { UserDocument } from '../user';

export const GameInvitationEvent = new EventEmitter<IDatabasePayload<GameInvitationDocument>>();

// Publish changes to Kafka.
GameInvitationEvent.on(payload => {
  kafka.publish(payload);
});

// Delete  Game Invitations if associated Namespace is deleted.
NamespaceEvent.on(async payload => {
  switch (payload.operationType) {
    case 'delete':
      const records = await GameInvitation.find({ namespaceId: payload.fullDocument._id });
      const promises = records.map(r => r.remove());
      return Promise.all(promises);
  }
});

@index({ namespaceId: 1, userId: 1 }, { unique: true })
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

  @prop({ immutable: true, ref: 'NamespaceSchema', required: true })
  public namespaceId: Ref<NamespaceDocument>;

  public updatedAt: Date;

  @prop({ ref: 'UserSchema', required: true })
  public userId: Ref<UserDocument>;

  @prop({ foreignField: '_id', justOne: true, localField: 'namespaceId', ref: 'NamespaceSchema' })
  public namespaceDocument: NamespaceDocument;

  @prop({ foreignField: '_id', justOne: true, localField: 'userId', ref: 'UserSchema' })
  public userDocument: UserDocument;
}

export type GameInvitationDocument = DocumentType<GameInvitationSchema>;
export type GameInvitationModel = ReturnModelType<typeof GameInvitationSchema>;
export const GameInvitation = getModelForClass(GameInvitationSchema);
