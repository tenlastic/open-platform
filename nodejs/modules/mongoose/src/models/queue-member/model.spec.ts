import { expect } from 'chai';

import { BuildModel } from '../build';
import { GameServerTemplateModel } from '../game-server-template';
import { GroupModel } from '../group';
import { NamespaceModel } from '../namespace';
import { QueueModel, QueueThresholdModel } from '../queue';
import { UserModel } from '../user';
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
      const group = await GroupModel.mock({
        userId: users[1]._id,
        userIds: [users[1]._id, users[2]._id],
      }).save();

      const namespace = await NamespaceModel.mock().save();
      const build = await BuildModel.mock({ namespaceId: namespace._id }).save();
      const gameServerTemplate = await GameServerTemplateModel.mock({
        buildId: build._id,
        namespaceId: namespace._id,
      }).save();
      const queue = await QueueModel.mock({
        gameServerTemplateId: gameServerTemplate._id,
        maximumGroupSize: 2,
        minimumGroupSize: 1,
        namespaceId: namespace._id,
        thresholds: [QueueThresholdModel.mock({ usersPerTeam: [1, 1] })],
      }).save();
      await Promise.all([
        QueueMemberModel.mock({
          namespaceId: namespace._id,
          queueId: queue._id,
          userId: users[0]._id,
        }).save(),
        QueueMemberModel.mock({
          groupId: group._id,
          namespaceId: namespace._id,
          queueId: queue._id,
          userId: users[1]._id,
        }).save(),
      ]);

      const result = await QueueMemberModel.getUserIdCount();

      expect(result).to.eql(3);
    });
  });
});
