import { ArticlePermissions } from '@tenlastic/mongoose';
import { find } from '@tenlastic/web-server';

export const handler = find(ArticlePermissions);
