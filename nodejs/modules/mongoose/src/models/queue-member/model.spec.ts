import { expect } from 'chai';
import { Build } from '../build';

import { Group } from '../group';
import { Namespace } from '../namespace';
import { Queue, QueueGameServerTemplate } from '../queue';
import { User } from '../user';
import { WebSocket } from '../web-socket';
import { QueueMember } from './model';

describe('models/queue-member', function () {
  describe('getUserIdCount()', function () {
    it('returns the number of matching records', async function () {
      const users = await Promise.all([
        User.mock().save(),
        User.mock().save(),
        User.mock().save(),
        User.mock().save(),
      ]);
      const group = await Group.mock({ userIds: [users[1]._id, users[2]._id] }).save();

      const namespace = await Namespace.mock().save();
      const build = await Build.mock({ namespaceId: namespace._id }).save();
      const queue = await Queue.mock({
        gameServerTemplate: QueueGameServerTemplate.mock({ buildId: build._id }),
        namespaceId: namespace._id,
        usersPerTeam: 2,
      }).save();
      const webSockets = await Promise.all([
        WebSocket.mock({ userId: users[0]._id }).save(),
        WebSocket.mock({ userId: users[1]._id }).save(),
      ]);
      await Promise.all([
        QueueMember.mock({
          namespaceId: namespace._id,
          queueId: queue._id,
          userId: users[0]._id,
          webSocketId: webSockets[0]._id,
        }).save(),
        QueueMember.mock({
          groupId: group._id,
          namespaceId: namespace._id,
          queueId: queue._id,
          userId: users[1]._id,
          webSocketId: webSockets[1]._id,
        }).save(),
      ]);

      const result = await QueueMember.getUserIdCount();

      expect(result).to.eql(3);
    });
  });
});
