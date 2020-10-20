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
import { GameServerDocument } from '../game-server';
import { Namespace, NamespaceDocument } from '../namespace';

export const QueueEvent = new EventEmitter<IDatabasePayload<QueueDocument>>();
QueueEvent.on(payload => {
  kafka.publish(payload);
});

@index({ namespaceId: 1 })
@modelOptions({
  schemaOptions: {
    autoIndex: true,
    collection: 'queues',
    minimize: false,
    timestamps: true,
  },
})
@plugin(changeStreamPlugin, {
  documentKeys: ['_id'],
  eventEmitter: QueueEvent,
})
export class QueueSchema {
  public _id: mongoose.Types.ObjectId;
  public createdAt: Date;

  @prop()
  public description: string;

  @prop({ _id: false, required: true })
  public gameServerTemplate: GameServerDocument;

  @prop({ required: true })
  public name: string;

  @prop({ ref: Namespace, required: true })
  public namespaceId: Ref<NamespaceDocument>;

  @prop({ required: true })
  public usersPerTeam: number;

  @prop({ required: true })
  public teams: number;

  public updatedAt: Date;

  @prop({
    foreignField: 'namespaceId',
    justOne: true,
    localField: 'namespaceId',
    ref: GameInvitation,
  })
  public gameInvitationDocument: GameInvitationDocument;

  @prop({ foreignField: '_id', justOne: true, localField: 'namespaceId', ref: Namespace })
  public namespaceDocument: NamespaceDocument;
}

export type QueueDocument = DocumentType<QueueSchema>;
export type QueueModel = ReturnModelType<typeof QueueSchema>;
export const Queue = getModelForClass(QueueSchema);
