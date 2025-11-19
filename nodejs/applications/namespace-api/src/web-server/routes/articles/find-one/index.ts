import { ArticleModel, ArticlePermissionOptions } from '@tenlastic/mongoose';
import { findOne } from '@tenlastic/web-server';

export const handler = findOne(ArticleModel, ArticlePermissionOptions);
