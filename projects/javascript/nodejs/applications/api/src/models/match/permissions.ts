import { MongoosePermissions } from '@tenlastic/mongoose-permissions';

import { Match, MatchDocument } from './model';

export const MatchPermissions = new MongoosePermissions<MatchDocument>(Match, {
  find: {
    base: {},
  },
  read: {
    base: ['_id', 'createdAt', 'finishedAt', 'queueId', 'startedAt', 'updatedAt', 'userIds'],
  },
});
