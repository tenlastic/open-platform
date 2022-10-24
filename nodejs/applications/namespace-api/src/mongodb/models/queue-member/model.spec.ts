import { expect } from 'chai';

import { GroupMock } from '../group';
import { NamespaceMock } from '../namespace';
import { QueueMock } from '../queue';
import { UserMock } from '../user';
import { QueueMemberMock } from './model.mock';
import { QueueMember } from './';

describe('mongodb/models/queue-member', function () {
  it('returns the number of matching records', async function () {
    const users = await Promise.all([
      UserMock.create(),
      UserMock.create(),
      UserMock.create(),
      UserMock.create(),
    ]);
    const group = await GroupMock.create({ userIds: [users[1]._id, users[2]._id] });

    const namespace = await NamespaceMock.create();
    const queue = await QueueMock.create({ namespaceId: namespace._id, usersPerTeam: 2 });
    await Promise.all([
      QueueMemberMock.create({
        namespaceId: namespace._id,
        queueId: queue._id,
        userId: users[0]._id,
      }),
      QueueMemberMock.create({
        groupId: group._id,
        namespaceId: namespace._id,
        queueId: queue._id,
      }),
    ]);

    const result = await QueueMember.getUserIdCount();

    expect(result).to.eql(3);
  });
});
