import {
  DocumentType,
  Ref,
  ReturnModelType,
  getModelForClass,
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

import { ReadonlyGame, ReadonlyGameDocument } from '../readonly-game';

export const ArticleEvent = new EventEmitter<IDatabasePayload<ArticleDocument>>();
ArticleEvent.on(kafka.publish);

@modelOptions({
  schemaOptions: {
    autoIndex: true,
    collection: 'articles',
    minimize: false,
    timestamps: true,
  },
})
@plugin(changeStreamPlugin, {
  documentKeys: ['_id'],
  eventEmitter: ArticleEvent,
})
export class ArticleSchema {
  public _id: mongoose.Types.ObjectId;

  @prop({ required: true })
  public body: string;

  @prop()
  public caption: string;

  public createdAt: Date;

  @prop({ ref: ReadonlyGame, required: true })
  public gameId: Ref<ReadonlyGameDocument>;

  @prop()
  public publishedAt: Date;

  @prop({ match: /^.{2,100}$/, required: true })
  public title: string;

  @prop({ default: 'News', enum: ['News', 'Patch Notes'] })
  public type: string;

  public updatedAt: Date;

  @prop({ foreignField: '_id', justOne: true, localField: 'gameId', ref: ReadonlyGame })
  public gameDocument: ReadonlyGameDocument;
}

export type ArticleDocument = DocumentType<ArticleSchema>;
export type ArticleModel = ReturnModelType<typeof ArticleSchema>;
export const Article = getModelForClass(ArticleSchema);
