import { GameServerModel, IGameServer } from '@tenlastic/http';
import wait from '@tenlastic/wait';
import { expect } from 'chai';
import * as Chance from 'chance';
import * as fs from 'fs';

import dependencies from '../../dependencies';
import { administratorAccessToken } from '../..';
import * as helpers from '../helpers';

const wssUrl = process.env.E2E_WSS_URL;

const chance = new Chance();

describe('/nodejs/namespace/queues', function () {
  let namespace: string;
  let username: string;
  let webSocketUrl: string;

  beforeEach(function () {
    namespace = chance.hash({ length: 32 });
    username = chance.hash({ length: 24 });
  });

  afterEach(async function () {
    dependencies.webSocketService.close(webSocketUrl);

    await wait(1 * 1000, 15 * 1000, () => helpers.deleteNamespace(namespace));
    await wait(1 * 1000, 15 * 1000, () => helpers.deleteUser(username));
  });

  it('creates a Namespace, Build, Game Server Template, and Queue', async function () {
    // Create the Namespace.
    const { _id } = await helpers.createNamespace(namespace);

    // Create the Build.
    const dockerfile = fs.readFileSync('./fixtures/Dockerfile', 'utf8');
    const build = await helpers.createBuild(dockerfile, namespace);

    // Create the Game Server.
    const gameServerTemplate = await dependencies.gameServerTemplateService.create(_id, {
      buildId: build._id,
      cpu: 0.1,
      memory: 500 * 1000 * 1000,
      name: chance.hash({ length: 32 }),
      ports: [{ port: 7777, protocol: IGameServer.Protocol.Tcp }],
      preemptible: true,
    });

    // Create the Queue.
    let queue = await dependencies.queueService.create(_id, {
      cpu: 0.1,
      gameServerTemplateId: gameServerTemplate._id,
      memory: 100 * 1000 * 1000,
      name: chance.hash({ length: 32 }),
      namespaceId: _id,
      preemptible: true,
      replicas: 1,
      usersPerTeam: [1],
    });

    // Wait for the Queue to run successfully.
    await wait(5 * 1000, 60 * 1000, async () => {
      queue = await dependencies.queueService.findOne(_id, queue._id);
      return queue.status.phase === 'Running';
    });
    await new Promise((resolve) => setTimeout(resolve, 5 * 1000));

    // Create a new User with a Web Socket connection.
    webSocketUrl = `${wssUrl}/namespaces/${_id}`;
    const user = await createUser(username, webSocketUrl);

    const queueMember = { queueId: queue._id, userId: user._id };
    const where = { queueId: queue._id };

    // Join the Queue and wait for Game Server to be created successfully.
    await dependencies.queueMemberService.create(queueMember, webSocketUrl);
    const gameServer: GameServerModel = await wait(5 * 1000, 60 * 1000, async () => {
      const gameServers = await dependencies.gameServerService.find(_id, { where });
      return gameServers[0];
    });

    // Make sure the Queue Members are deleted.
    let queueMembers = await dependencies.queueMemberService.find(_id, { where });
    expect(queueMembers.length).to.eql(0);

    // Delete the Game Server and wait for the Match to be finished.
    await dependencies.gameServerService.delete(_id, gameServer._id);
    await wait(5 * 1000, 60 * 1000, async () => {
      const [match] = await dependencies.matchService.find(_id, { where });
      return match.finishedAt;
    });

    // Update the Queue to require two Users.
    const usersPerTeam = [1, 1];
    queue = await dependencies.queueService.update(_id, queue._id, { usersPerTeam });

    // Join the Queue, close the Web Socket, and wait for asynchronous Queue Member deletion.
    await dependencies.queueMemberService.create(queueMember, webSocketUrl);
    dependencies.webSocketService.close(`${wssUrl}/namespaces/${_id}`);
    await new Promise((resolve) => setTimeout(resolve, 5 * 1000));

    // Make sure the Queue Members are deleted.
    queueMembers = await dependencies.queueMemberService.find(_id, { where });
    expect(queueMembers.length).to.eql(0);

    // Check for Queue Logs.
    const logs = await wait(2.5 * 1000, 5 * 1000, async () => {
      const response = await dependencies.queueLogService.find(
        _id,
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

async function createUser(username: string, webSocketUrl: string) {
  // Create a new User.
  const password = chance.hash();
  const user = await dependencies.userService.create({ password, username });

  try {
    // Log in with the new User.
    const credentials = await dependencies.loginService.createWithCredentials(
      user.username,
      password,
    );
    dependencies.tokenService.setAccessToken(credentials.accessToken);

    // Connect to the web socket server.
    await dependencies.webSocketService.connect(webSocketUrl);
  } finally {
    // Restore original access token.
    dependencies.tokenService.setAccessToken(administratorAccessToken);
  }

  return user;
}
