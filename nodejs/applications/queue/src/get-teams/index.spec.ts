import { QueueMemberModel, QueueModel } from '@tenlastic/http';
import { expect } from 'chai';
import * as Chance from 'chance';

import { getTeams } from './';

const chance = new Chance();

describe('get-teams', function () {
  it('handles solo queue', function () {
    const queue = new QueueModel({ thresholds: [{ seconds: 0, usersPerTeam: [1, 1] }] });
    const queueMembers = [
      new QueueMemberModel({ createdAt: new Date(0), userIds: [chance.hash()] }),
      new QueueMemberModel({ createdAt: new Date(), userIds: [chance.hash()] }),
    ];

    const result = getTeams(queue, queueMembers);
    expect(result[0]).to.eql({ index: 0, userIds: queueMembers[0].userIds });
    expect(result[1]).to.eql({ index: 1, userIds: queueMembers[1].userIds });
  });

  it('handles group queue', function () {
    const queue = new QueueModel({ thresholds: [{ seconds: 0, usersPerTeam: [2, 2] }] });
    const queueMembers = [
      new QueueMemberModel({ createdAt: new Date(0), userIds: [chance.hash(), chance.hash()] }),
      new QueueMemberModel({ createdAt: new Date(), userIds: [chance.hash(), chance.hash()] }),
    ];

    const result = getTeams(queue, queueMembers);

    expect(result[0]).to.eql({ index: 0, userIds: queueMembers[0].userIds });
    expect(result[1]).to.eql({ index: 1, userIds: queueMembers[1].userIds });
  });

  it('handles groups of different sizes', function () {
    const queue = new QueueModel({ thresholds: [{ seconds: 0, usersPerTeam: [2, 2] }] });
    const queueMembers = [
      new QueueMemberModel({ createdAt: new Date(0), userIds: [chance.hash()] }),
      new QueueMemberModel({ createdAt: new Date(), userIds: [chance.hash(), chance.hash()] }),
      new QueueMemberModel({ createdAt: new Date(), userIds: [chance.hash()] }),
    ];

    const result = getTeams(queue, queueMembers);

    expect(result[0]).to.eql({ index: 0, userIds: queueMembers[0].userIds });
    expect(result[1]).to.eql({ index: 0, userIds: queueMembers[2].userIds });
    expect(result[2]).to.eql({ index: 1, userIds: queueMembers[1].userIds });
  });

  it('splits large groups into teams of 1 if enough spots are remaining', function () {
    const queue = new QueueModel({ thresholds: [{ seconds: 0, usersPerTeam: [1, 1, 1, 1, 1] }] });
    const queueMembers = [
      new QueueMemberModel({ createdAt: new Date(0), userIds: [chance.hash(), chance.hash()] }),
      new QueueMemberModel({ createdAt: new Date(), userIds: [chance.hash()] }),
      new QueueMemberModel({ createdAt: new Date(), userIds: [chance.hash(), chance.hash()] }),
    ];

    const result = getTeams(queue, queueMembers);

    expect(result[0]).to.eql({ index: 0, userIds: queueMembers[0].userIds.slice(0, 1) });
    expect(result[1]).to.eql({ index: 1, userIds: queueMembers[0].userIds.slice(1, 2) });
    expect(result[2]).to.eql({ index: 2, userIds: queueMembers[1].userIds });
    expect(result[3]).to.eql({ index: 3, userIds: queueMembers[2].userIds.slice(0, 1) });
    expect(result[4]).to.eql({ index: 4, userIds: queueMembers[2].userIds.slice(1, 2) });
  });

  it('splits large groups into teams of 2 if enough spots are remaining', function () {
    const queue = new QueueModel({ thresholds: [{ seconds: 0, usersPerTeam: [2, 2] }] });
    const queueMembers = [
      new QueueMemberModel({ createdAt: new Date(0), userIds: [chance.hash()] }),
      new QueueMemberModel({
        createdAt: new Date(),
        userIds: [chance.hash(), chance.hash(), chance.hash()],
      }),
    ];

    const result = getTeams(queue, queueMembers);

    expect(result[0]).to.eql({ index: 0, userIds: queueMembers[0].userIds });
    expect(result[1]).to.eql({ index: 0, userIds: queueMembers[1].userIds.slice(0, 1) });
    expect(result[2]).to.eql({ index: 1, userIds: queueMembers[1].userIds.slice(1, 3) });
  });

  it('splits very large groups into teams of 2 if enough spots are remaining', function () {
    const queue = new QueueModel({ thresholds: [{ seconds: 0, usersPerTeam: [2, 2, 2, 2, 2] }] });
    const queueMembers = [
      new QueueMemberModel({
        createdAt: new Date(0),
        userIds: [chance.hash(), chance.hash(), chance.hash(), chance.hash(), chance.hash()],
      }),
      new QueueMemberModel({ createdAt: new Date(), userIds: [chance.hash()] }),
      new QueueMemberModel({
        createdAt: new Date(),
        userIds: [chance.hash(), chance.hash(), chance.hash(), chance.hash()],
      }),
    ];

    const result = getTeams(queue, queueMembers);

    expect(result[0]).to.eql({ index: 0, userIds: queueMembers[0].userIds.slice(0, 2) });
    expect(result[1]).to.eql({ index: 1, userIds: queueMembers[0].userIds.slice(2, 4) });
    expect(result[2]).to.eql({ index: 2, userIds: queueMembers[0].userIds.slice(4, 5) });
    expect(result[3]).to.eql({ index: 2, userIds: queueMembers[1].userIds });
    expect(result[4]).to.eql({ index: 3, userIds: queueMembers[2].userIds.slice(0, 2) });
    expect(result[5]).to.eql({ index: 4, userIds: queueMembers[2].userIds.slice(2, 4) });
  });

  it('skips large groups if not enough spots are remaining', function () {
    const queue = new QueueModel({ thresholds: [{ seconds: 0, usersPerTeam: [1, 1, 1, 1, 1] }] });
    const queueMembers = [
      new QueueMemberModel({ createdAt: new Date(0), userIds: [chance.hash(), chance.hash()] }),
      new QueueMemberModel({ createdAt: new Date(), userIds: [chance.hash()] }),
      new QueueMemberModel({ createdAt: new Date(), userIds: [chance.hash()] }),
      new QueueMemberModel({ createdAt: new Date(0), userIds: [chance.hash(), chance.hash()] }),
      new QueueMemberModel({ createdAt: new Date(), userIds: [chance.hash()] }),
    ];

    const result = getTeams(queue, queueMembers);

    expect(result[0]).to.eql({ index: 0, userIds: queueMembers[0].userIds.slice(0, 1) });
    expect(result[1]).to.eql({ index: 1, userIds: queueMembers[0].userIds.slice(1, 2) });
    expect(result[2]).to.eql({ index: 2, userIds: queueMembers[1].userIds });
    expect(result[3]).to.eql({ index: 3, userIds: queueMembers[2].userIds });
    expect(result[4]).to.eql({ index: 4, userIds: queueMembers[4].userIds });
  });

  it('skips very large groups if not enough spots are remaining', function () {
    const queue = new QueueModel({ thresholds: [{ seconds: 0, usersPerTeam: [2, 2, 2, 2, 2] }] });
    const queueMembers = [
      new QueueMemberModel({
        createdAt: new Date(0),
        userIds: [chance.hash(), chance.hash(), chance.hash(), chance.hash(), chance.hash()],
      }),
      new QueueMemberModel({ createdAt: new Date(), userIds: [chance.hash()] }),
      new QueueMemberModel({
        createdAt: new Date(),
        userIds: [chance.hash(), chance.hash(), chance.hash(), chance.hash(), chance.hash()],
      }),
    ];

    const result = getTeams(queue, queueMembers);

    expect(result).to.eql(null);
  });

  it('handles multiple thresholds with equal seconds', function () {
    const queue = new QueueModel({
      thresholds: [
        { seconds: 0, usersPerTeam: [1] },
        { seconds: 0, usersPerTeam: [2] },
        { seconds: 0, usersPerTeam: [3] },
        { seconds: 0, usersPerTeam: [4] },
        { seconds: 0, usersPerTeam: [5] },
      ],
    });
    const queueMembers = [
      new QueueMemberModel({ createdAt: new Date(0), userIds: [chance.hash()] }),
      new QueueMemberModel({ createdAt: new Date(), userIds: [chance.hash(), chance.hash()] }),
      new QueueMemberModel({ createdAt: new Date(), userIds: [chance.hash()] }),
    ];

    const result = getTeams(queue, queueMembers);

    expect(result.length).to.eql(1);
    expect(result[0]).to.eql({ index: 0, userIds: queueMembers[0].userIds });
  });

  it('handles multiple thresholds with different seconds', function () {
    const queue = new QueueModel({
      thresholds: [
        { seconds: 0, usersPerTeam: [1, 1, 1, 1, 1] },
        { seconds: 5, usersPerTeam: [1, 1, 1, 1] },
        { seconds: 10, usersPerTeam: [1, 1, 1] },
        { seconds: 15, usersPerTeam: [1, 1] },
        { seconds: 20, usersPerTeam: [1] },
      ],
    });
    const queueMembers = [
      new QueueMemberModel({ createdAt: new Date(0), userIds: [chance.hash()] }),
      new QueueMemberModel({ createdAt: new Date(), userIds: [chance.hash()] }),
      new QueueMemberModel({ createdAt: new Date(), userIds: [chance.hash()] }),
    ];

    const result = getTeams(queue, queueMembers);

    expect(result[0]).to.eql({ index: 0, userIds: queueMembers[0].userIds });
    expect(result[1]).to.eql({ index: 1, userIds: queueMembers[1].userIds });
    expect(result[2]).to.eql({ index: 2, userIds: queueMembers[2].userIds });
  });

  it('handles rating thresholds', function () {
    const queue = new QueueModel({
      teams: true,
      thresholds: [
        { rating: 100, seconds: 0, usersPerTeam: [1, 1] },
        { rating: 75, seconds: 5, usersPerTeam: [1, 1] },
        { rating: 50, seconds: 10, usersPerTeam: [1, 1] },
        { rating: 25, seconds: 15, usersPerTeam: [1, 1] },
        { rating: 0, seconds: 20, usersPerTeam: [1, 1] },
      ],
    });
    const queueMembers = [
      new QueueMemberModel({
        createdAt: new Date(0),
        team: { rating: 1500 },
        userIds: [chance.hash()],
      }),
      new QueueMemberModel({
        createdAt: new Date(),
        team: { rating: 1750 },
        userIds: [chance.hash()],
      }),
      new QueueMemberModel({
        createdAt: new Date(),
        team: { rating: 1550 },
        userIds: [chance.hash()],
      }),
    ];

    const result = getTeams(queue, queueMembers);

    expect(result.length).to.eql(2);
    expect(result[0]).to.eql({ index: 0, rating: 1500, userIds: queueMembers[0].userIds });
    expect(result[1]).to.eql({ index: 1, rating: 1550, userIds: queueMembers[2].userIds });
  });
});
