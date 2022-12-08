import {
  BuildModel,
  GameServerModel,
  IBuild,
  IGameServer,
  Jwt,
  NamespaceModel,
  QueueModel,
} from '@tenlastic/http';
import wait from '@tenlastic/wait';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as Chance from 'chance';
import * as FormData from 'form-data';
import * as fs from 'fs';
import * as JSZip from 'jszip';

import dependencies from '../../dependencies';
import { step } from '../../step';
import { administratorAccessToken } from '../..';

const wssUrl = process.env.E2E_WSS_URL;

const chance = new Chance();
use(chaiAsPromised);

describe('/nodejs/namespace/queues', function () {
  let build: BuildModel;
  let queue: QueueModel;
  let namespace: NamespaceModel;

  after(async function () {
    await dependencies.namespaceService.delete(namespace._id);
  });

  step('creates a Namespace', async function () {
    namespace = await dependencies.namespaceService.create({
      limits: {
        bandwidth: 1 * 1000 * 1000 * 1000,
        cpu: 1,
        memory: 1 * 1000 * 1000 * 1000,
        storage: 10 * 1000 * 1000 * 1000,
      },
      name: chance.hash({ length: 64 }),
    });
    expect(namespace).to.exist;
  });

  step('runs the Namespace successfully', async function () {
    await wait(5 * 1000, 60 * 1000, async () => {
      namespace = await dependencies.namespaceService.findOne(namespace._id);
      return namespace.status.phase === 'Running';
    });
  });

  step('creates a Build', async function () {
    // Get Dockerfile from filesystem.
    const dockerfile = fs.readFileSync('./fixtures/Dockerfile', 'utf8');

    // Generate a zip stream.
    const zip = new JSZip();
    zip.file('Dockerfile', dockerfile);
    const buffer = await zip.generateAsync({
      compression: 'DEFLATE',
      compressionOptions: { level: 1 },
      type: 'nodebuffer',
    });

    // Create a Build.
    const formData = new FormData();
    formData.append(
      'record',
      JSON.stringify({
        entrypoint: 'Dockerfile',
        name: chance.hash({ length: 64 }),
        namespaceId: namespace._id,
        platform: IBuild.Platform.Server64,
      } as BuildModel),
    );
    formData.append('zip', buffer, { contentType: 'application/zip', filename: 'example.zip' });
    build = await dependencies.buildService.create(namespace._id, formData);

    expect(build).to.exist;
  });

  step('finishes the Build successfully', async function () {
    const phase = await wait(5 * 1000, 2 * 60 * 1000, async () => {
      build = await dependencies.buildService.findOne(namespace._id, build._id);
      return build.status.finishedAt ? build.status.phase : null;
    });

    expect(phase).to.eql('Succeeded');
  });

  step('creates a Queue', async function () {
    queue = await dependencies.queueService.create(namespace._id, {
      cpu: 0.1,
      gameServerTemplate: {
        buildId: build._id,
        cpu: 0.1,
        memory: 100 * 1000 * 1000,
        ports: [{ port: 7777, protocol: IGameServer.Protocol.Tcp }],
        preemptible: true,
      },
      memory: 100 * 1000 * 1000,
      name: chance.hash({ length: 64 }),
      namespaceId: namespace._id,
      preemptible: true,
      replicas: 1,
      usersPerTeam: [1, 1],
    });

    expect(queue).to.exist;
  });

  step('runs the Queue successfully', async function () {
    await wait(5 * 1000, 60 * 1000, async () => {
      queue = await dependencies.queueService.findOne(namespace._id, queue._id);
      return queue.status.phase === 'Running';
    });
  });

  step('removes disconnected Users', async function () {
    const { user, webSocketId } = await createUser(namespace._id);

    // Add Queue Members.
    await dependencies.queueMemberService.create(namespace._id, {
      namespaceId: namespace._id,
      queueId: queue._id,
      userId: user._id,
      webSocketId,
    });

    try {
      // Close WebSocket and wait for asynchronous Queue Member deletion.
      dependencies.streamService.close(`${wssUrl}/namespaces/${namespace._id}`);
      await new Promise((resolve) => setTimeout(resolve, 5 * 1000));

      const queueMembers = await dependencies.queueMemberService.find(namespace._id, {
        where: { queueId: queue._id },
      });
      expect(queueMembers.length).to.eql(0);
    } finally {
      dependencies.streamService.close(`${wssUrl}/namespaces/${namespace._id}`);
      await dependencies.userService.delete(user._id);
    }
  });

  step('creates a Game Server', async function () {
    queue = await dependencies.queueService.update(namespace._id, queue._id, { usersPerTeam: [1] });
    const { user, webSocketId } = await createUser(namespace._id);

    // Add Queue Members.
    await dependencies.queueMemberService.create(namespace._id, {
      namespaceId: namespace._id,
      queueId: queue._id,
      userId: user._id,
      webSocketId,
    });

    try {
      // Wait for Game Server to be created.
      const gameServer: GameServerModel = await wait(5 * 1000, 60 * 1000, async () => {
        const gameServers = await dependencies.gameServerService.find(namespace._id, {
          where: { queueId: queue._id },
        });
        return gameServers[0];
      });

      expect(gameServer.buildId).to.eql(build._id);
      expect(gameServer.metadata.teamAssignments).to.eql(user._id);
      expect(gameServer.metadata.teams).to.eql(1);
      expect(gameServer.metadata.usersPerTeam).to.eql(1);
      expect(gameServer.queueId).to.eql(queue._id);

      const queueMembers = await dependencies.queueMemberService.find(namespace._id, {
        where: { queueId: queue._id },
      });
      expect(queueMembers.length).to.eql(0);
    } finally {
      dependencies.streamService.close(`${wssUrl}/namespaces/${namespace._id}`);
      await dependencies.userService.delete(user._id);
    }
  });

  step('generates logs', async function () {
    const logs = await wait(2.5 * 1000, 5 * 1000, async () => {
      const response = await dependencies.queueLogService.find(
        namespace._id,
        queue._id,
        queue.status.nodes[0].pod,
        queue.status.nodes[0].container,
        {},
      );
      return response.length > 0 ? response : null;
    });

    expect(logs.length).to.be.greaterThan(0);
  });
});

async function createUser(namespaceId: string) {
  // Create a new User.
  const password = chance.hash();
  const user = await dependencies.userService.create({
    password,
    username: chance.hash({ length: 24 }),
  });

  const credentials = await dependencies.loginService.createWithCredentials(
    user.username,
    password,
  );
  dependencies.tokenService.setAccessToken(credentials.accessToken);

  // Connect to the web socket server.
  await dependencies.streamService.connect({
    accessToken: new Jwt(credentials.accessToken),
    url: `${wssUrl}/namespaces/${namespaceId}`,
  });
  const webSocketId = await dependencies.streamService.getId(`${wssUrl}/namespaces/${namespaceId}`);

  // Restore original access token.
  dependencies.tokenService.setAccessToken(administratorAccessToken);

  return { user, webSocketId };
}
