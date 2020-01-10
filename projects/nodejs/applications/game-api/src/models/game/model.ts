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

import { ReadonlyNamespace, ReadonlyNamespaceDocument } from '../readonly-namespace';

export const GameEvent = new EventEmitter<IDatabasePayload<GameDocument>>();
GameEvent.on(kafka.publish);

@index({ name: 1 }, { unique: true })
@index({ slug: 1 }, { unique: true })
@modelOptions({
  schemaOptions: {
    autoIndex: true,
    collection: 'games',
    minimize: false,
    timestamps: true,
  },
})
@plugin(changeStreamPlugin, {
  documentKeys: ['_id'],
  eventEmitter: GameEvent,
})
@plugin(uniqueErrorPlugin)
export class GameSchema {
  public _id: mongoose.Types.ObjectId;

  public createdAt: Date;

  @prop()
  public description: string;

  @prop({ match: /^.{2,40}$/, required: true })
  public name: string;

  @prop({ ref: ReadonlyNamespace, required: true })
  public namespaceId: Ref<ReadonlyNamespaceDocument>;

  @prop({ match: /^[0-9a-z\-]{2,40}$/ })
  public slug: string;

  public updatedAt: Date;

  @prop({ foreignField: '_id', justOne: true, localField: 'namespaceId', ref: ReadonlyNamespace })
  public namespaceDocument: ReadonlyNamespaceDocument;
}

export type GameDocument = DocumentType<GameSchema>;
export type GameModel = ReturnModelType<typeof GameSchema>;
export const Game = getModelForClass(GameSchema);
