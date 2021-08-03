import {
  BuildModel,
  buildService,
  GameServerModel,
  gameServerService,
  getAccessToken,
  IBuild,
  loginService,
  NamespaceModel,
  namespaceService,
  queueLogService,
  queueMemberService,
  QueueModel,
  queueService,
  setAccessToken,
  userService,
  WebSocket,
} from '@tenlastic/http';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as Chance from 'chance';
import * as JSZip from 'jszip';
import { step } from 'mocha-steps';

import { wait } from '../wait';

const wssUrl = process.env.E2E_WSS_URL;

const chance = new Chance();
use(chaiAsPromised);

describe('queues', function() {
  let build: BuildModel;
  let queue: QueueModel;
  let namespace: NamespaceModel;

  before(async function() {
    namespace = await namespaceService.create({ name: chance.hash() });

    // Generate a zip stream.
    const zip = new JSZip();
    zip.file('Dockerfile', 'FROM inanimate/echo-server:latest');
    const buffer = await zip.generateAsync({
      compression: 'DEFLATE',
      compressionOptions: { level: 1 },
      type: 'nodebuffer',
    });

    // Create a Build.
    build = await buildService.create(
      {
        entrypoint: 'Dockerfile',
        name: chance.hash(),
        namespaceId: namespace._id,
        platform: IBuild.Platform.Server64,
      },
      buffer,
    );

    // Wait for Build to finish.
    await wait(10000, 180000, async () => {
      const response = await buildService.findOne(build._id);
      return response.status?.phase === 'Succeeded';
    });
  });

  after(async function() {
    await namespaceService.delete(namespace._id);
  });

  step('creates a Queue', async function() {
    queue = await queueService.create({
      cpu: 0.1,
      gameServerTemplate: {
        buildId: build._id,
        cpu: 0.1,
        memory: 100 * 1000 * 1000,
        preemptible: true,
      },
      memory: 100 * 1000 * 1000,
      name: chance.hash(),
      namespaceId: namespace._id,
      preemptible: true,
      replicas: 1,
      teams: 2,
      usersPerTeam: 1,
    });

    // Wait for Queue to be running.
    await wait(10000, 180000, async () => {
      queue = await queueService.findOne(queue._id);
      return queue.status?.phase === 'Running';
    });
  });

  step('generates logs', async function() {
    const logs = await wait(2.5 * 1000, 10 * 1000, async () => {
      const response = await queueLogService.find(queue._id, queue.status.nodes[0]._id, {});
      return response.length > 0 ? response : null;
    });

    expect(logs.length).to.be.greaterThan(0);
  });

  step('removes disconnected Users', async function() {
    const user = await createUser();

    // Add Queue Members.
    await queueMemberService.create({
      namespaceId: namespace._id,
      queueId: queue._id,
      userId: user.user._id,
      webSocketId: user.webSocketId,
    });

    try {
      // Close WebSocket and wait for asynchronous Queue Member deletion.
      user.webSocket.close();
      await new Promise(resolve => setTimeout(resolve, 5000));

      const queueMembers = await queueMemberService.find({ where: { queueId: queue._id } });
      expect(queueMembers.length).to.eql(0);
    } finally {
      user.webSocket.close();
      await userService.delete(user.user._id);
    }
  });

  step('creates a Game Server', async function() {
    const firstUser = await createUser();
    const secondUser = await createUser();
    const users = [firstUser, secondUser];

    // Add Queue Members.
    await queueMemberService.create({
      namespaceId: namespace._id,
      queueId: queue._id,
      userId: users[0].user._id,
      webSocketId: users[0].webSocketId,
    });
    await queueMemberService.create({
      namespaceId: namespace._id,
      queueId: queue._id,
      userId: users[1].user._id,
      webSocketId: users[1].webSocketId,
    });

    try {
      // Wait for Game Server to be created.
      const gameServer: GameServerModel = await wait(10000, 180000, async () => {
        const gameServers = await gameServerService.find({ where: { queueId: queue._id } });
        return gameServers[0];
      });

      expect(gameServer.buildId).to.eql(build._id);
      expect(gameServer.metadata.teamAssignments).to.eql(users.map(u => u.user._id).join(','));
      expect(gameServer.metadata.teams).to.eql(2);
      expect(gameServer.metadata.usersPerTeam).to.eql(1);
      expect(gameServer.queueId).to.eql(queue._id);

      const queueMembers = await queueMemberService.find({ where: { queueId: queue._id } });
      expect(queueMembers.length).to.eql(0);
    } finally {
      users.forEach(u => u.webSocket.close());
      await Promise.all(users.map(u => userService.delete(u.user._id)));
    }
  });
});

async function createUser() {
  // Create a new User.
  const password = chance.hash();
  const user = await userService.create({ password, username: chance.hash({ length: 20 }) });
  const login = await loginService.createWithCredentials(user.username, password);

  // Update access token to new User.
  const accessToken = await getAccessToken();
  setAccessToken(login.accessToken);

  // Connect to the web socket server.
  const webSocket = new WebSocket();
  await webSocket.connect(wssUrl);

  // Wait for the Web Socket to be returned.
  const webSocketId = await new Promise<string>(resolve => {
    webSocket.emitter.on('message', payload => {
      if (!payload._id && payload.fullDocument && payload.operationType === 'insert') {
        return resolve(payload.fullDocument._id);
      }
    });
  });

  // Restore original access token.
  setAccessToken(accessToken);

  return { user, webSocket, webSocketId };
}
