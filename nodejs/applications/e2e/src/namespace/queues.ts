import { BuildModel, GameServerModel, IBuild, NamespaceModel, QueueModel } from '@tenlastic/http';
import wait from '@tenlastic/wait';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as Chance from 'chance';
import * as FormData from 'form-data';
import * as JSZip from 'jszip';
import { step } from 'mocha-steps';

import dependencies from '../dependencies';

const wssUrl = process.env.E2E_WSS_URL;

const chance = new Chance();
use(chaiAsPromised);

describe('queues', function () {
  let build: BuildModel;
  let queue: QueueModel;
  let namespace: NamespaceModel;

  before(async function () {
    namespace = await dependencies.namespaceService.create({ name: chance.hash() });

    // Generate a zip stream.
    const zip = new JSZip();
    zip.file('Dockerfile', 'FROM inanimate/echo-server:latest');
    const buffer = await zip.generateAsync({
      compression: 'DEFLATE',
      compressionOptions: { level: 1 },
      streamFiles: true,
      type: 'nodebuffer',
    });

    // Create a Build.
    const formData = new FormData();
    formData.append(
      'record',
      JSON.stringify({
        entrypoint: 'Dockerfile',
        name: chance.hash(),
        namespaceId: namespace._id,
        platform: IBuild.Platform.Server64,
      } as BuildModel),
    );
    formData.append('zip', buffer);
    build = await dependencies.buildService.create(namespace._id, formData);

    // Wait for Build to finish.
    await wait(10000, 180000, async () => {
      const response = await dependencies.buildService.findOne(namespace._id, build._id);
      return response.status?.phase === 'Succeeded';
    });
  });

  after(async function () {
    await dependencies.namespaceService.delete(namespace._id);
  });

  step('creates a Queue', async function () {
    queue = await dependencies.queueService.create(namespace._id, {
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
      queue = await dependencies.queueService.findOne(namespace._id, queue._id);
      return queue.status?.phase === 'Running';
    });
  });

  step('generates logs', async function () {
    const logs = await wait(2.5 * 1000, 10 * 1000, async () => {
      const response = await dependencies.queueLogService.find(
        namespace._id,
        queue._id,
        queue.status.nodes[0]._id,
        {},
      );
      return response.length > 0 ? response : null;
    });

    expect(logs.length).to.be.greaterThan(0);
  });

  step('removes disconnected Users', async function () {
    const user = await createUser();

    // Add Queue Members.
    await dependencies.queueMemberService.create(namespace._id, {
      namespaceId: namespace._id,
      queueId: queue._id,
      userId: user.user._id,
      webSocketId: user.webSocketId,
    });

    try {
      // Close WebSocket and wait for asynchronous Queue Member deletion.
      dependencies.streamService.close(wssUrl);
      await new Promise((resolve) => setTimeout(resolve, 5000));

      const queueMembers = await dependencies.queueMemberService.find(namespace._id, {
        where: { queueId: queue._id },
      });
      expect(queueMembers.length).to.eql(0);
    } finally {
      dependencies.streamService.close(wssUrl);
      await dependencies.userService.delete(user.user._id);
    }
  });

  step('creates a Game Server', async function () {
    const firstUser = await createUser();
    const secondUser = await createUser();
    const users = [firstUser, secondUser];

    // Add Queue Members.
    await dependencies.queueMemberService.create(namespace._id, {
      namespaceId: namespace._id,
      queueId: queue._id,
      userId: users[0].user._id,
      webSocketId: users[0].webSocketId,
    });
    await dependencies.queueMemberService.create(namespace._id, {
      namespaceId: namespace._id,
      queueId: queue._id,
      userId: users[1].user._id,
      webSocketId: users[1].webSocketId,
    });

    try {
      // Wait for Game Server to be created.
      const gameServer: GameServerModel = await wait(10000, 180000, async () => {
        const gameServers = await dependencies.gameServerService.find(namespace._id, {
          where: { queueId: queue._id },
        });
        return gameServers[0];
      });

      expect(gameServer.buildId).to.eql(build._id);
      expect(gameServer.metadata.teamAssignments).to.eql(users.map((u) => u.user._id).join(','));
      expect(gameServer.metadata.teams).to.eql(2);
      expect(gameServer.metadata.usersPerTeam).to.eql(1);
      expect(gameServer.queueId).to.eql(queue._id);

      const queueMembers = await dependencies.queueMemberService.find(namespace._id, {
        where: { queueId: queue._id },
      });
      expect(queueMembers.length).to.eql(0);
    } finally {
      dependencies.streamService.close(wssUrl);
      await Promise.all(users.map((u) => dependencies.userService.delete(u.user._id)));
    }
  });
});

async function createUser() {
  // Create a new User.
  const password = chance.hash();
  const user = await dependencies.userService.create({
    password,
    username: chance.hash({ length: 20 }),
  });

  const accessToken = await dependencies.tokenService.getAccessToken();
  await dependencies.loginService.createWithCredentials(user.username, password);

  // Connect to the web socket server.
  await dependencies.streamService.connect(wssUrl);
  const webSocketId = await dependencies.streamService.getId(wssUrl);

  // Restore original access token.
  dependencies.tokenService.setAccessToken(accessToken.value);

  return { user, webSocketId };
}
