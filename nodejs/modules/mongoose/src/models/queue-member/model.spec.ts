import { expect } from 'chai';
import { BuildModel } from '../build';

import { GroupModel } from '../group';
import { NamespaceModel } from '../namespace';
import { QueueModel, QueueGameServerTemplateModel } from '../queue';
import { UserModel } from '../user';
import { WebSocketModel } from '../web-socket';
import { QueueMemberModel } from './model';

describe('models/queue-member', function () {
  describe('getUserIdCount()', function () {
    it('returns the number of matching records', async function () {
      const users = await Promise.all([
        UserModel.mock().save(),
        UserModel.mock().save(),
        UserModel.mock().save(),
        UserModel.mock().save(),
      ]);
      const group = await GroupModel.mock({ userIds: [users[1]._id, users[2]._id] }).save();

      const namespace = await NamespaceModel.mock().save();
      const build = await BuildModel.mock({ namespaceId: namespace._id }).save();
      const queue = await QueueModel.mock({
        gameServerTemplate: QueueGameServerTemplateModel.mock({ buildId: build._id }),
        namespaceId: namespace._id,
        usersPerTeam: 2,
      }).save();
      const webSockets = await Promise.all([
        WebSocketModel.mock({ userId: users[0]._id }).save(),
        WebSocketModel.mock({ userId: users[1]._id }).save(),
      ]);
      await Promise.all([
        QueueMemberModel.mock({
          namespaceId: namespace._id,
          queueId: queue._id,
          userId: users[0]._id,
          webSocketId: webSockets[0]._id,
        }).save(),
        QueueMemberModel.mock({
          groupId: group._id,
          namespaceId: namespace._id,
          queueId: queue._id,
          userId: users[1]._id,
          webSocketId: webSockets[1]._id,
        }).save(),
      ]);

      const result = await QueueMemberModel.getUserIdCount();

      expect(result).to.eql(3);
    });
  });
});
