import {
  GameInvitationMock,
  GroupMock,
  NamespaceDocument,
  NamespaceMock,
  QueueMemberMock,
  QueueMock,
  UserDocument,
  UserMock,
} from '@tenlastic/mongoose-models';
import { expect } from 'chai';

import { getTeamAssignments } from './';

describe('get-team-assignments', function() {
  let namespace: NamespaceDocument;
  let users: UserDocument[];

  beforeEach(async function() {
    namespace = await NamespaceMock.create();
    users = await Promise.all([
      UserMock.create(),
      UserMock.create(),
      UserMock.create(),
      UserMock.create(),
    ]);

    await Promise.all([
      GameInvitationMock.create({ namespaceId: namespace._id, userId: users[0]._id }),
      GameInvitationMock.create({ namespaceId: namespace._id, userId: users[1]._id }),
      GameInvitationMock.create({ namespaceId: namespace._id, userId: users[2]._id }),
      GameInvitationMock.create({ namespaceId: namespace._id, userId: users[3]._id }),
    ]);
  });

  it('handles solo queue', async function() {
    const queue = await QueueMock.create({ namespaceId: namespace._id, teams: 2, usersPerTeam: 1 });
    const queueMembers = await Promise.all([
      QueueMemberMock.create({ queueId: queue._id, userId: users[0]._id }),
      QueueMemberMock.create({ queueId: queue._id, userId: users[1]._id }),
    ]);

    const result = getTeamAssignments(queue, queueMembers);

    expect(result[0][0].toString()).to.eql(users[0]._id.toString());
    expect(result[1][0].toString()).to.eql(users[1]._id.toString());
  });

  it('handles group queue', async function() {
    const group = await GroupMock.create({ userIds: [users[0]._id, users[1]._id] });
    const queue = await QueueMock.create({ namespaceId: namespace._id, teams: 2, usersPerTeam: 2 });
    const queueMembers = await Promise.all([
      QueueMemberMock.create({ groupId: group._id, queueId: queue._id }),
      QueueMemberMock.create({ queueId: queue._id, userId: users[2]._id }),
      QueueMemberMock.create({ queueId: queue._id, userId: users[3]._id }),
    ]);

    const result = getTeamAssignments(queue, queueMembers);

    expect(result[0][0].toString()).to.eql(users[0]._id.toString());
    expect(result[0][1].toString()).to.eql(users[1]._id.toString());
    expect(result[1][0].toString()).to.eql(users[2]._id.toString());
    expect(result[1][1].toString()).to.eql(users[3]._id.toString());
  });

  it('accounts for group size', async function() {
    const group = await GroupMock.create({ userIds: [users[0]._id, users[1]._id] });
    const queue = await QueueMock.create({ namespaceId: namespace._id, teams: 2, usersPerTeam: 2 });
    const queueMembers = await Promise.all([
      QueueMemberMock.create({ queueId: queue._id, userId: users[2]._id }),
      QueueMemberMock.create({ groupId: group._id, queueId: queue._id }),
      QueueMemberMock.create({ queueId: queue._id, userId: users[3]._id }),
    ]);

    const result = getTeamAssignments(queue, queueMembers);

    expect(result[0][0].toString()).to.eql(users[0]._id.toString());
    expect(result[0][1].toString()).to.eql(users[1]._id.toString());
    expect(result[1][0].toString()).to.eql(users[2]._id.toString());
    expect(result[1][1].toString()).to.eql(users[3]._id.toString());
  });

  it('skips larger groups', async function() {
    const group = await GroupMock.create({ userIds: [users[0]._id, users[1]._id] });
    const queue = await QueueMock.create({ namespaceId: namespace._id, teams: 2, usersPerTeam: 2 });
    const queueMembers = await Promise.all([
      QueueMemberMock.create({ queueId: queue._id, userId: users[2]._id }),
      QueueMemberMock.create({ groupId: group._id, queueId: queue._id }),
      QueueMemberMock.create({ queueId: queue._id, userId: users[3]._id }),
    ]);

    queue.usersPerTeam = 1;
    await queue.save();

    const result = getTeamAssignments(queue, queueMembers);

    expect(result[0][0].toString()).to.eql(users[2]._id.toString());
    expect(result[1][0].toString()).to.eql(users[3]._id.toString());
  });
});
