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

import { Game, GameDocument } from '../game';

export const ReleaseEvent = new EventEmitter<IDatabasePayload<ReleaseDocument>>();
ReleaseEvent.on(kafka.publish);

@index({ version: 1 }, { unique: true })
@index({ gameId: 1 })
@modelOptions({
  schemaOptions: {
    autoIndex: true,
    collection: 'releases',
    minimize: false,
    timestamps: true,
  },
})
@plugin(changeStreamPlugin, {
  documentKeys: ['_id'],
  eventEmitter: ReleaseEvent,
})
export class ReleaseSchema {
  public _id: mongoose.Types.ObjectId;
  public createdAt: Date;

  @prop({ required: true })
  public entrypoint: string;

  @prop({ ref: Game, required: true })
  public gameId: Ref<GameDocument>;

  @prop()
  public publishedAt: Date;

  @prop({ required: true })
  public version: string;

  public updatedAt: Date;

  @prop({ foreignField: '_id', justOne: true, localField: 'gameId', ref: Game })
  public gameDocument: GameDocument;
}

export type ReleaseDocument = DocumentType<ReleaseSchema>;
export type ReleaseModel = ReturnModelType<typeof ReleaseSchema>;
export const Release = getModelForClass(ReleaseSchema);
