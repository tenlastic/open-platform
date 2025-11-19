import { Chance } from 'chance';
import * as mongoose from 'mongoose';

import { unsetPlugin } from '../../plugins';
import { AuthorizationDocument } from '../authorization';

export enum ArticleType {
  Guide = 'Guide',
  News = 'News',
  PatchNotes = 'PatchNotes',
}

export interface Article {
  _id: mongoose.Types.ObjectId;
  authorizationDocuments?: AuthorizationDocument[];
  body: string;
  createdAt?: Date;
  namespaceId: mongoose.Types.ObjectId;
  publishedAt?: Date;
  subtitle?: string;
  title: string;
  type: ArticleType;
  updatedAt?: Date;
}

export type ArticleDocument = mongoose.Document<mongoose.Types.ObjectId> & Article;

export interface ArticleModelType extends mongoose.Model<ArticleDocument> {
  /**
   * Creates a record with randomized required parameters if not specified.
   */
  mock(this: ArticleModelType, values?: Partial<Article>): ArticleDocument;
}

const ArticleSchema = new mongoose.Schema<ArticleDocument, ArticleModelType>(
  {
    body: { maxlength: 10240, required: true, trim: true, type: String },
    namespaceId: { ref: 'NamespaceSchema', required: true, type: mongoose.Schema.Types.ObjectId },
    publishedAt: { type: Date },
    subtitle: { maxlength: 96, trim: true, type: String },
    title: { maxlength: 96, required: true, trim: true, type: String },
    type: { enum: Object.values(ArticleType), required: true, type: String },
  },
  {
    collection: 'articles',
    timestamps: true,
  },
);

ArticleSchema.index({ namespaceId: 1 });
ArticleSchema.index({ publishedAt: 1 });

ArticleSchema.plugin(unsetPlugin);

ArticleSchema.virtual('authorizationDocuments', {
  foreignField: 'namespaceId',
  justOne: false,
  localField: 'namespaceId',
  ref: 'AuthorizationSchema',
});

ArticleSchema.statics.mock = function (values: Partial<Article> = {}) {
  const chance = new Chance();
  const defaults: Partial<Article> = {
    body: chance.hash(),
    namespaceId: new mongoose.Types.ObjectId(),
    title: chance.hash(),
    type: ArticleType.Guide,
  };

  return new this({ ...defaults, ...values });
};

export const ArticleModel = mongoose.model<ArticleDocument, ArticleModelType>(
  'ArticleSchema',
  ArticleSchema,
  'articles',
);

export default ArticleModel;
