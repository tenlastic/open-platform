import { CollectionPermissions } from '@tenlastic/mongoose-models';
import { find } from '@tenlastic/web-server';

export const handler = find(CollectionPermissions);
