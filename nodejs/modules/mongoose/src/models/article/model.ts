import {
  DocumentType,
  getModelForClass,
  index,
  modelOptions,
  plugin,
  prop,
} from '@typegoose/typegoose';
import { Chance } from 'chance';
import * as mongoose from 'mongoose';

import { unsetPlugin } from '../../plugins';
import { AuthorizationDocument } from '../authorization';

export enum ArticleType {
  Guide = 'Guide',
  News = 'News',
  PatchNotes = 'PatchNotes',
}

@index({ namespaceId: 1 })
@index({ publishedAt: 1 })
@modelOptions({ schemaOptions: { collection: 'articles', timestamps: true } })
@plugin(unsetPlugin)
export class ArticleSchema {
  public _id: mongoose.Types.ObjectId;

  @prop({ maxlength: 10240, required: true, trim: true, type: String })
  public body: string;

  public createdAt: Date;

  @prop({ ref: 'NamespaceSchema', required: true, type: mongoose.Schema.Types.ObjectId })
  public namespaceId: mongoose.Types.ObjectId;

  @prop({ type: Date })
  public publishedAt: Date;

  @prop({ maxlength: 96, trim: true, type: String })
  public subtitle: string;

  @prop({ maxlength: 96, required: true, trim: true, type: String })
  public title: string;

  @prop({ enum: ArticleType, required: true, type: String })
  public type: ArticleType;

  public updatedAt: Date;

  @prop({ foreignField: 'namespaceId', localField: 'namespaceId', ref: 'AuthorizationSchema' })
  public authorizationDocuments: AuthorizationDocument[];

  /**
   * Creates a record with randomized required parameters if not specified.
   */
  public static mock(this: typeof ArticleModel, values: Partial<ArticleSchema> = {}) {
    const chance = new Chance();
    const defaults = {
      body: chance.hash(),
      namespaceId: new mongoose.Types.ObjectId(),
      type: ArticleType.Guide,
      title: chance.hash(),
    };

    return new this({ ...defaults, ...values });
  }
}

export type ArticleDocument = DocumentType<ArticleSchema>;
export const ArticleModel = getModelForClass(ArticleSchema);
