import { IGameServer, NamespaceModel } from '@tenlastic/http';
import wait from '@tenlastic/wait';
import axios from 'axios';
import { expect } from 'chai';
import * as Chance from 'chance';
import * as fs from 'fs';
import { URL } from 'url';

import dependencies from '../../dependencies';
import * as helpers from '../helpers';

const chance = new Chance();

describe('/nodejs/namespace/game-servers', function () {
  let namespace: NamespaceModel;

  afterEach(async function () {
    await dependencies.namespaceService.delete(namespace._id);
  });

  it('creates a Namespace, Build, and Game Server', async function () {
    // Create the Namespace.
    namespace = await helpers.createNamespace();

    // Create the Build.
    const dockerfile = fs.readFileSync('./fixtures/Dockerfile', 'utf8');
    const build = await helpers.createBuild(dockerfile, namespace);

    // Create the Game Server.
    let gameServer = await dependencies.gameServerService.create(namespace._id, {
      buildId: build._id,
      cpu: 0.1,
      memory: 500 * 1000 * 1000,
      name: chance.hash({ length: 64 }),
      ports: [{ port: 7777, protocol: IGameServer.Protocol.Tcp }],
      preemptible: true,
    });

    await wait(5 * 1000, 60 * 1000, async () => {
      gameServer = await dependencies.gameServerService.findOne(namespace._id, gameServer._id);
      return gameServer.status.endpoints.length > 0 && gameServer.status.phase === 'Running';
    });

    // Connect to the Game Server.
    const { externalIp, externalPort } = gameServer.status.endpoints[0];
    const hostname = externalIp === '127.0.0.1' ? 'kubernetes.local.tenlastic.com' : externalIp;
    const url = new URL(`http://${hostname}:${externalPort}`);

    const { data } = await axios({ method: 'get', url: url.href });
    expect(data).to.include('Welcome to echo-server!');

    // Check for Game Server Logs.
    const logs = await wait(2.5 * 1000, 5 * 1000, async () => {
      const response = await dependencies.gameServerLogService.find(
        namespace._id,
        gameServer._id,
        gameServer.status.nodes[0].pod,
        gameServer.status.nodes[0].container,
        {},
      );
      return response.length > 0 ? response : null;
    });
    expect(logs.length).to.be.greaterThan(0);
  });
});
