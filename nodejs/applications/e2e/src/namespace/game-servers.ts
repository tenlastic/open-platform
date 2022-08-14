import { BuildModel, GameServerModel, IBuild, NamespaceModel } from '@tenlastic/http';
import wait from '@tenlastic/wait';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as Chance from 'chance';
import * as FormData from 'form-data';
import * as JSZip from 'jszip';
import { step } from 'mocha-steps';
import * as requestPromiseNative from 'request-promise-native';
import { URL } from 'url';

import dependencies from '../dependencies';

const chance = new Chance();
use(chaiAsPromised);

describe('game-servers', function () {
  let build: BuildModel;
  let gameServer: GameServerModel;
  let namespace: NamespaceModel;

  before(async function () {
    namespace = await dependencies.namespaceService.create({ name: chance.hash() });

    // Generate a zip stream.
    const zip = new JSZip();
    zip.file('Dockerfile', 'FROM inanimate/echo-server:latest\nENV PORT 7777');
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

  step('creates a Game Server', async function () {
    gameServer = await dependencies.gameServerService.create(namespace._id, {
      buildId: build._id,
      cpu: 0.1,
      memory: 500 * 1000 * 1000,
      name: chance.hash(),
      namespaceId: namespace._id,
      preemptible: true,
    });

    // Wait for Game Server to be running.
    await wait(10000, 180000, async () => {
      gameServer = await dependencies.gameServerService.findOne(namespace._id, gameServer._id);
      return gameServer.status?.endpoints && gameServer.status?.phase === 'Running';
    });
  });

  step('generates logs', async function () {
    const logs = await wait(2.5 * 1000, 10 * 1000, async () => {
      const response = await dependencies.gameServerLogService.find(
        namespace._id,
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
