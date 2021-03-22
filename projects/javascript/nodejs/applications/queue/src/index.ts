import 'source-map-support/register';

import * as requestPromiseNative from 'request-promise-native';

import { createGameServer } from './create-game-server';
import { removeConflictedUsers } from './remove-conflicted-users';

const INTERVAL = 5000;

const accessToken = process.env.ACCESS_TOKEN;
const queueId = process.env.QUEUE_ID;

(async function main() {
  try {
    const queueResponse = await requestPromiseNative.get({
      headers: { Authorization: `Bearer ${accessToken}` },
      json: true,
      url: `http://api.default:3000/queues/${queueId}`,
    });
    const queue = queueResponse.record;

    const queueMemberResponse = await requestPromiseNative.get({
      headers: { Authorization: `Bearer ${accessToken}` },
      json: true,
      qs: JSON.stringify({ where: { queueId } }),
      url: `http://api.default:3000/queue-members`,
    });
    let queueMembers = queueMemberResponse.records;
    console.log(`Processing ${queueMembers.length} QueueMembers...`);

    // Remove Queue Members already in a match.
    queueMembers = await removeConflictedUsers(queue, queueMembers);
    console.log(`Processing ${queueMembers.length} unmatched QueueMembers .`);

    while (queueMembers.length > 0) {
      const result = await createGameServer(queue, queueMembers);
      queueMembers = result.queueMembers;

      console.log(`GameServer created successfully: ${result.gameServer._id}.`);
      console.log(`Processing ${queueMembers.length} unmatched QueueMembers .`);
    }
  } catch (e) {
    if (e.body && e.body.errors) {
      e.body.errors.forEach(error => console.error(error.message));
    } else {
      console.error(e.message);
    }
  } finally {
    setTimeout(main, INTERVAL);
  }
})();
