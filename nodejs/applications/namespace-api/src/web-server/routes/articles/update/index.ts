import { ArticleModel, ArticlePermissionOptions } from '@tenlastic/mongoose';
import { updateOne } from '@tenlastic/web-server';

export const handler = updateOne(ArticleModel, ArticlePermissionOptions);
