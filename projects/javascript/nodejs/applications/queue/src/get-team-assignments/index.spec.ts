import { expect } from 'chai';
import * as Chance from 'chance';

import { getTeamAssignments } from './';

const chance = new Chance();

describe('get-team-assignments', function() {
  it('handles solo queue', async function() {
    const queue = { teams: 2, usersPerTeam: 1 };
    const queueMembers = [{ userIds: [chance.hash()] }, { userIds: [chance.hash()] }];

    const result = getTeamAssignments(queue, queueMembers);

    expect(result[0]).to.eql(queueMembers[0].userIds[0]);
    expect(result[1]).to.eql(queueMembers[1].userIds[0]);
  });

  it('handles group queue', async function() {
    const queue = { teams: 2, usersPerTeam: 2 };
    const queueMembers = [
      { userIds: [chance.hash(), chance.hash()] },
      { userIds: [chance.hash()] },
      { userIds: [chance.hash()] },
    ];

    const result = getTeamAssignments(queue, queueMembers);

    expect(result[0]).to.eql(queueMembers[0].userIds[0]);
    expect(result[1]).to.eql(queueMembers[0].userIds[1]);
    expect(result[2]).to.eql(queueMembers[1].userIds[0]);
    expect(result[3]).to.eql(queueMembers[2].userIds[0]);
  });

  it('accounts for group size', async function() {
    const queue = { teams: 2, usersPerTeam: 2 };
    const queueMembers = [
      { userIds: [chance.hash()] },
      { userIds: [chance.hash(), chance.hash()] },
      { userIds: [chance.hash()] },
    ];

    const result = getTeamAssignments(queue, queueMembers);

    expect(result[0]).to.eql(queueMembers[1].userIds[0]);
    expect(result[1]).to.eql(queueMembers[1].userIds[1]);
    expect(result[2]).to.eql(queueMembers[0].userIds[0]);
    expect(result[3]).to.eql(queueMembers[2].userIds[0]);
  });

  it('skips larger groups', async function() {
    const queue = { teams: 2, usersPerTeam: 1 };
    const queueMembers = [
      { userIds: [chance.hash(), chance.hash()] },
      { userIds: [chance.hash()] },
      { userIds: [chance.hash()] },
    ];

    const result = getTeamAssignments(queue, queueMembers);

    expect(result[0]).to.eql(queueMembers[1].userIds[0]);
    expect(result[1]).to.eql(queueMembers[2].userIds[0]);
  });
});
