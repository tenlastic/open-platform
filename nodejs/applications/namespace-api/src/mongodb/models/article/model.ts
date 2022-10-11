import { changeStreamPlugin, EventEmitter, IDatabasePayload } from '@tenlastic/mongoose-models';
import {
  DocumentType,
  ReturnModelType,
  getModelForClass,
  index,
  modelOptions,
  plugin,
  prop,
} from '@typegoose/typegoose';
import * as mongoose from 'mongoose';

import { AuthorizationDocument } from '../authorization';

export const OnArticleProduced = new EventEmitter<IDatabasePayload<ArticleDocument>>();

@index({ namespaceId: 1 })
@index({ publishedAt: 1 })
@modelOptions({ schemaOptions: { collection: 'articles', minimize: false, timestamps: true } })
@plugin(changeStreamPlugin, { documentKeys: ['_id'], eventEmitter: OnArticleProduced })
export class ArticleSchema {
  public _id: mongoose.Types.ObjectId;

  @prop({ required: true, type: String })
  public body: string;

  @prop({ type: String })
  public caption: string;

  public createdAt: Date;

  @prop({ ref: 'NamespaceSchema', required: true, type: mongoose.Schema.Types.ObjectId })
  public namespaceId: mongoose.Types.ObjectId;

  @prop({ default: null, type: Date })
  public publishedAt: Date;

  @prop({ match: /^.{2,100}$/, required: true, type: String })
  public title: string;

  @prop({ default: 'News', enum: ['Guide', 'News', 'Patch Notes'], type: String })
  public type: string;

  public updatedAt: Date;

  @prop({ foreignField: 'namespaceId', localField: 'namespaceId', ref: 'AuthorizationSchema' })
  public authorizationDocuments: AuthorizationDocument[];
}

export type ArticleDocument = DocumentType<ArticleSchema>;
export type ArticleModel = ReturnModelType<typeof ArticleSchema>;
export const Article = getModelForClass(ArticleSchema);
