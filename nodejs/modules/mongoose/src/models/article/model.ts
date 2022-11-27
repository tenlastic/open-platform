import {
  DocumentType,
  getModelForClass,
  index,
  modelOptions,
  prop,
  ReturnModelType,
} from '@typegoose/typegoose';
import { Chance } from 'chance';
import * as mongoose from 'mongoose';

import { AuthorizationDocument } from '../authorization';

@index({ namespaceId: 1 })
@index({ publishedAt: 1 })
@modelOptions({ schemaOptions: { collection: 'articles', minimize: false, timestamps: true } })
export class ArticleSchema {
  public _id: mongoose.Types.ObjectId;

  @prop({ required: true, type: String })
  public body: string;

  @prop({ type: String })
  public caption: string;

  public createdAt: Date;

  @prop({ ref: 'NamespaceSchema', required: true, type: mongoose.Schema.Types.ObjectId })
  public namespaceId: mongoose.Types.ObjectId;

  @prop({ type: Date })
  public publishedAt: Date;

  @prop({ match: /^.{2,100}$/, required: true, type: String })
  public title: string;

  @prop({ default: 'News', enum: ['Guide', 'News', 'Patch Notes'], type: String })
  public type: string;

  public updatedAt: Date;

  @prop({ foreignField: 'namespaceId', localField: 'namespaceId', ref: 'AuthorizationSchema' })
  public authorizationDocuments: AuthorizationDocument[];

  /**
   * Creates a record with randomized required parameters if not specified.
   */
  public static mock(this: ArticleModel, values: Partial<ArticleSchema> = {}) {
    const chance = new Chance();
    const defaults = {
      body: chance.hash(),
      namespaceId: new mongoose.Types.ObjectId(),
      title: chance.hash(),
    };

    return new this({ ...defaults, ...values });
  }
}

export type ArticleDocument = DocumentType<ArticleSchema>;
export type ArticleModel = ReturnModelType<typeof ArticleSchema>;
export const Article = getModelForClass(ArticleSchema);