import {
  BuildModel,
  buildService,
  gameServerLogService,
  GameServerModel,
  gameServerService,
  IBuild,
  NamespaceModel,
  namespaceService,
} from '@tenlastic/http';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as Chance from 'chance';
import * as JSZip from 'jszip';
import { step } from 'mocha-steps';
import * as requestPromiseNative from 'request-promise-native';
import { URL } from 'url';

import { wait } from '../wait';

const chance = new Chance();
use(chaiAsPromised);

describe('game-servers', function () {
  let build: BuildModel;
  let gameServer: GameServerModel;
  let namespace: NamespaceModel;

  before(async function () {
    namespace = await namespaceService.create({ name: chance.hash() });

    // Generate a zip stream.
    const zip = new JSZip();
    zip.file('Dockerfile', 'FROM inanimate/echo-server:latest\nENV PORT 7777');
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

  after(async function () {
    await namespaceService.delete(namespace._id);
  });

  step('creates a Game Server', async function () {
    gameServer = await gameServerService.create({
      buildId: build._id,
      cpu: 0.1,
      memory: 500 * 1000 * 1000,
      name: chance.hash(),
      namespaceId: namespace._id,
      preemptible: true,
    });

    // Wait for Game Server to be running.
    await wait(10000, 180000, async () => {
      gameServer = await gameServerService.findOne(gameServer._id);
      return gameServer.status?.endpoints && gameServer.status?.phase === 'Running';
    });
  });

  step('generates logs', async function () {
    const logs = await wait(2.5 * 1000, 10 * 1000, async () => {
      const response = await gameServerLogService.find(
        gameServer._id,
        gameServer.status.nodes[0]._id,
        {},
      );
      return response.length > 0 ? response : null;
    });

    expect(logs.length).to.be.greaterThan(0);
  });

  step('allows connections', async function () {
    const http = gameServer.status.endpoints.tcp.replace('tcp', 'http');
    const url = new URL(http);
    url.hostname = url.hostname === '127.0.0.1' ? 'kubernetes.localhost' : url.hostname;

    const response = await requestPromiseNative.get(url.href);
    expect(response).to.include('Welcome to echo-server!');
  });
});
