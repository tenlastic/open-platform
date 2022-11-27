import { ArticleSchema as BaseArticleSchema } from '@tenlastic/mongoose';
import { DocumentType, ReturnModelType, getModelForClass } from '@typegoose/typegoose';

export class ArticleSchema extends BaseArticleSchema {}
export type ArticleDocument = DocumentType<ArticleSchema>;
export type ArticleModel = ReturnModelType<typeof ArticleSchema>;
export const Article = getModelForClass(ArticleSchema);
