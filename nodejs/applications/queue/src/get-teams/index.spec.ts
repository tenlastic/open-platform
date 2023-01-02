import { QueueMemberModel, QueueModel } from '@tenlastic/http';
import { expect } from 'chai';
import * as Chance from 'chance';

import { getTeams } from './';

const chance = new Chance();

describe('get-teams', function () {
  it('handles solo queue', async function () {
    const queue = new QueueModel({ usersPerTeam: [1, 1] });
    const queueMembers = [
      new QueueMemberModel({ userIds: [chance.hash()] }),
      new QueueMemberModel({ userIds: [chance.hash()] }),
    ];

    const result = getTeams(queue, queueMembers);

    expect(result[0].userIds[0]).to.eql(queueMembers[0].userIds[0]);
    expect(result[1].userIds[0]).to.eql(queueMembers[1].userIds[0]);
  });

  it('handles group queue', async function () {
    const queue = new QueueModel({ usersPerTeam: [2, 2] });
    const queueMembers = [
      new QueueMemberModel({ userIds: [chance.hash(), chance.hash()] }),
      new QueueMemberModel({ userIds: [chance.hash()] }),
      new QueueMemberModel({ userIds: [chance.hash()] }),
    ];

    const result = getTeams(queue, queueMembers);

    expect(result[0].userIds[0]).to.eql(queueMembers[0].userIds[0]);
    expect(result[0].userIds[1]).to.eql(queueMembers[0].userIds[1]);
    expect(result[1].userIds[0]).to.eql(queueMembers[1].userIds[0]);
    expect(result[1].userIds[1]).to.eql(queueMembers[2].userIds[0]);
  });

  it('accounts for group size', async function () {
    const queue = new QueueModel({ usersPerTeam: [2, 2] });
    const queueMembers = [
      new QueueMemberModel({ userIds: [chance.hash()] }),
      new QueueMemberModel({ userIds: [chance.hash(), chance.hash()] }),
      new QueueMemberModel({ userIds: [chance.hash()] }),
    ];

    const result = getTeams(queue, queueMembers);

    expect(result[0].userIds[0]).to.eql(queueMembers[0].userIds[0]);
    expect(result[0].userIds[1]).to.eql(queueMembers[2].userIds[0]);
    expect(result[1].userIds[0]).to.eql(queueMembers[1].userIds[0]);
    expect(result[1].userIds[1]).to.eql(queueMembers[1].userIds[1]);
  });

  it('skips larger groups', async function () {
    const queue = new QueueModel({ usersPerTeam: [1, 1] });
    const queueMembers = [
      new QueueMemberModel({ userIds: [chance.hash(), chance.hash()] }),
      new QueueMemberModel({ userIds: [chance.hash()] }),
      new QueueMemberModel({ userIds: [chance.hash()] }),
    ];

    const result = getTeams(queue, queueMembers);

    expect(result[0].userIds[0]).to.eql(queueMembers[1].userIds[0]);
    expect(result[1].userIds[0]).to.eql(queueMembers[2].userIds[0]);
  });
});
