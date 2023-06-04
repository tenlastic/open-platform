import { IGameServer } from '@tenlastic/http';
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
  let namespace: string;

  beforeEach(function () {
    namespace = chance.hash({ length: 32 });
  });

  afterEach(async function () {
    await wait(1 * 1000, 15 * 1000, () => helpers.deleteNamespace(namespace));
  });

  it('creates a Namespace, Build, and Game Server', async function () {
    // Create the Namespace.
    const { _id } = await helpers.createNamespace(namespace);

    // Create the Build.
    const dockerfile = fs.readFileSync('./fixtures/Dockerfile', 'utf8');
    const build = await helpers.createBuild(dockerfile, namespace);

    // Create the Game Server.
    let gameServer = await dependencies.gameServerService.create(_id, {
      buildId: build._id,
      cpu: 0.1,
      memory: 500 * 1000 * 1000,
      name: chance.hash({ length: 32 }),
      ports: [{ port: 7777, protocol: IGameServer.Protocol.Tcp }],
      preemptible: true,
    });

    await wait(5 * 1000, 60 * 1000, async () => {
      gameServer = await dependencies.gameServerService.findOne(_id, gameServer._id);
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
        _id,
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
