import { GameServerModel, IGameServer, NamespaceModel } from '@tenlastic/http';
import wait from '@tenlastic/wait';
import { expect } from 'chai';
import * as Chance from 'chance';
import * as fs from 'fs';

import dependencies from '../../dependencies';
import * as helpers from '../helpers';
import { administratorAccessToken } from '../..';

const wssUrl = process.env.E2E_WSS_URL;

const chance = new Chance();

describe('/nodejs/namespace/queues', function () {
  let namespace: NamespaceModel;

  afterEach(async function () {
    await helpers.deleteNamespace(namespace?._id);
  });

  it('creates a Namespace, Build, Game Server Template, and Queue', async function () {
    // Create the Namespace.
    namespace = await helpers.createNamespace();

    // Create the Build.
    const dockerfile = fs.readFileSync('./fixtures/Dockerfile', 'utf8');
    const build = await helpers.createBuild(dockerfile, namespace);

    // Create the Game Server.
    const gameServerTemplate = await dependencies.gameServerTemplateService.create(namespace._id, {
      buildId: build._id,
      cpu: 0.1,
      memory: 500 * 1000 * 1000,
      name: chance.hash({ length: 64 }),
      ports: [{ port: 7777, protocol: IGameServer.Protocol.Tcp }],
      preemptible: true,
    });

    // Create the Queue.
    let queue = await dependencies.queueService.create(namespace._id, {
      cpu: 0.1,
      gameServerTemplateId: gameServerTemplate._id,
      memory: 100 * 1000 * 1000,
      name: chance.hash({ length: 64 }),
      namespaceId: namespace._id,
      preemptible: true,
      replicas: 1,
      usersPerTeam: [1],
    });

    // Wait for the Queue to run successfully.
    await wait(5 * 1000, 60 * 1000, async () => {
      queue = await dependencies.queueService.findOne(namespace._id, queue._id);
      return queue.status.phase === 'Running';
    });

    // Create a User and Web Socket connection.
    const { user, webSocketUrl } = await createUser(namespace._id);

    try {
      const queueId = queue._id;
      const userId = user._id;
      const where = { queueId: queue._id };

      // Join the Queue and wait for Game Server to be created successfully.
      await dependencies.queueMemberService.create({ queueId, userId }, webSocketUrl);
      const gameServer: GameServerModel = await wait(5 * 1000, 60 * 1000, async () => {
        const gameServers = await dependencies.gameServerService.find(namespace._id, { where });
        return gameServers[0];
      });
      expect(gameServer.buildId).to.eql(build._id);
      expect(gameServer.matchId).to.exist;
      expect(gameServer.queueId).to.eql(queue._id);

      // Make sure the Queue Members are deleted.
      let queueMembers = await dependencies.queueMemberService.find(namespace._id, { where });
      expect(queueMembers.length).to.eql(0);

      // Update the Queue to require two Users.
      const usersPerTeam = [1, 1];
      queue = await dependencies.queueService.update(namespace._id, queue._id, { usersPerTeam });

      // Join the Queue and close the Web Socket.
      await dependencies.queueMemberService.create({ queueId, userId }, webSocketUrl);
      dependencies.webSocketService.close(`${wssUrl}/namespaces/${namespace._id}`);
      await new Promise((resolve) => setTimeout(resolve, 5 * 1000));

      // Make sure the Queue Members are deleted.
      queueMembers = await dependencies.queueMemberService.find(namespace._id, { where });
      expect(queueMembers.length).to.eql(0);
    } finally {
      dependencies.webSocketService.close(`${wssUrl}/namespaces/${namespace._id}`);
      await dependencies.userService.delete(user._id);
    }

    // Check for Queue Logs.
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
  const webSocketUrl = `${wssUrl}/namespaces/${namespaceId}`;
  await dependencies.webSocketService.connect(webSocketUrl);

  // Restore original access token.
  dependencies.tokenService.setAccessToken(administratorAccessToken);

  return { webSocketUrl, user };
}
