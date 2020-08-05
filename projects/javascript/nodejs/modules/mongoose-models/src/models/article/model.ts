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

export const ArticleEvent = new EventEmitter<IDatabasePayload<ArticleDocument>>();
ArticleEvent.on(payload => {
  kafka.publish(payload);
});

@index({ gameId: 1 })
@index({ publishedAt: 1 })
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

  @prop({ ref: Game, required: true })
  public gameId: Ref<GameDocument>;

  @prop()
  public publishedAt: Date;

  @prop({ match: /^.{2,100}$/, required: true })
  public title: string;

  @prop({ default: 'News', enum: ['News', 'Patch Notes'] })
  public type: string;

  public updatedAt: Date;

  @prop({ foreignField: '_id', justOne: true, localField: 'gameId', ref: Game })
  public gameDocument: GameDocument;
}

export type ArticleDocument = DocumentType<ArticleSchema>;
export type ArticleModel = ReturnModelType<typeof ArticleSchema>;
export const Article = getModelForClass(ArticleSchema);
