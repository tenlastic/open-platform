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

import { namespaceValidator } from '../../validators';
import { GameDocument } from '../game';
import { GameInvitationDocument } from '../game-invitation';
import { GameServerDocument } from '../game-server';
import { NamespaceDocument, NamespaceEvent } from '../namespace';

export const QueueEvent = new EventEmitter<IDatabasePayload<QueueDocument>>();

// Publish changes to Kafka.
QueueEvent.sync(kafka.publish);

// Delete Queues if associated Namespace is deleted.
NamespaceEvent.sync(async payload => {
  switch (payload.operationType) {
    case 'delete':
      const records = await Queue.find({ namespaceId: payload.fullDocument._id });
      const promises = records.map(r => r.remove());
      return Promise.all(promises);
  }
});

@index({ gameId: 1 })
@index({ namespaceId: 1 })
@modelOptions({ schemaOptions: { collection: 'queues', minimize: false, timestamps: true } })
@plugin(changeStreamPlugin, { documentKeys: ['_id'], eventEmitter: QueueEvent })
export class QueueSchema {
  public _id: mongoose.Types.ObjectId;
  public createdAt: Date;

  @prop()
  public description: string;

  @prop({ ref: 'GameSchema', validate: namespaceValidator('gameDocument', 'gameId') })
  public gameId: Ref<GameDocument>;

  @prop({ _id: false, required: true })
  public gameServerTemplate: GameServerDocument;

  @prop({ required: true })
  public name: string;

  @prop({ immutable: true, ref: 'NamespaceSchema', required: true })
  public namespaceId: Ref<NamespaceDocument>;

  @prop({ required: true })
  public teams: number;

  public updatedAt: Date;

  @prop({ required: true })
  public usersPerTeam: number;

  @prop({ foreignField: '_id', justOne: true, localField: 'gameId', ref: 'GameSchema' })
  public gameDocument: GameDocument;

  @prop({
    foreignField: 'namespaceId',
    justOne: true,
    localField: 'namespaceId',
    ref: 'GameInvitationSchema',
  })
  public gameInvitationDocument: GameInvitationDocument;

  @prop({ foreignField: '_id', justOne: true, localField: 'namespaceId', ref: 'NamespaceSchema' })
  public namespaceDocument: NamespaceDocument;
}

export type QueueDocument = DocumentType<QueueSchema>;
export type QueueModel = ReturnModelType<typeof QueueSchema>;
export const Queue = getModelForClass(QueueSchema);
