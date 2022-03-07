import {
  DocumentType,
  Ref,
  ReturnModelType,
  getModelForClass,
  index,
  modelOptions,
  plugin,
  prop,
} from '@typegoose/typegoose';
import {
  EventEmitter,
  IDatabasePayload,
  changeStreamPlugin,
} from '@tenlastic/mongoose-change-stream';
import * as mongoose from 'mongoose';

import { namespaceValidator } from '../../validators';
import { GameDocument, GameEvent } from '../game';
import { NamespaceDocument, NamespaceEvent } from '../namespace';

export const ArticleEvent = new EventEmitter<IDatabasePayload<ArticleDocument>>();

// Delete Articles if associated Game is deleted.
GameEvent.sync(async (payload) => {
  switch (payload.operationType) {
    case 'delete':
      const records = await Article.find({ gameId: payload.fullDocument._id });
      const promises = records.map((r) => r.remove());
      return Promise.all(promises);
  }
});

// Delete Articles if associated Namespace is deleted.
NamespaceEvent.sync(async (payload) => {
  switch (payload.operationType) {
    case 'delete':
      const records = await Article.find({ namespaceId: payload.fullDocument._id });
      const promises = records.map((r) => r.remove());
      return Promise.all(promises);
  }
});

@index({ gameId: 1 })
@index({ namespaceId: 1 })
@index({ publishedAt: 1 })
@modelOptions({
  schemaOptions: {
    collection: 'articles',
    minimize: false,
    timestamps: true,
  },
})
@plugin(changeStreamPlugin, { documentKeys: ['_id'], eventEmitter: ArticleEvent })
export class ArticleSchema {
  public _id: mongoose.Types.ObjectId;

  @prop({ required: true })
  public body: string;

  @prop()
  public caption: string;

  public createdAt: Date;

  @prop({
    ref: 'GameSchema',
    required: true,
    validate: namespaceValidator('gameDocument', 'gameId'),
  })
  public gameId: Ref<GameDocument>;

  @prop({ immutable: true, ref: 'NamespaceSchema', required: true })
  public namespaceId: Ref<NamespaceDocument>;

  @prop({ default: null })
  public publishedAt: Date;

  @prop({ match: /^.{2,100}$/, required: true })
  public title: string;

  @prop({ default: 'News', enum: ['Guide', 'News', 'Patch Notes'] })
  public type: string;

  public updatedAt: Date;

  @prop({ foreignField: '_id', justOne: true, localField: 'gameId', ref: 'GameSchema' })
  public gameDocument: GameDocument;

  @prop({ foreignField: '_id', justOne: true, localField: 'namespaceId', ref: 'NamespaceSchema' })
  public namespaceDocument: NamespaceDocument;
}

export type ArticleDocument = DocumentType<ArticleSchema>;
export type ArticleModel = ReturnModelType<typeof ArticleSchema>;
export const Article = getModelForClass(ArticleSchema);
