import { ArticlePermissions } from '../../../../mongodb';
import { count } from '@tenlastic/web-server';

export const handler = count(ArticlePermissions);
