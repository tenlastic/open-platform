import { BuildModel, GameServerModel, IBuild, NamespaceModel } from '@tenlastic/http';
import wait from '@tenlastic/wait';
import axios from 'axios';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as Chance from 'chance';
import * as FormData from 'form-data';
import * as fs from 'fs';
import * as JSZip from 'jszip';
import { URL } from 'url';

import dependencies from '../../dependencies';
import { step } from '../../step';

const chance = new Chance();
use(chaiAsPromised);

describe('/nodejs/namespace/game-servers', function () {
  let build: BuildModel;
  let gameServer: GameServerModel;
  let namespace: NamespaceModel;

  after(async function () {
    await dependencies.namespaceService.delete(namespace._id);
  });

  step('creates a Namespace', async function () {
    namespace = await dependencies.namespaceService.create({ name: chance.hash() });
    expect(namespace).to.exist;
  });

  step('runs the Namespace successfully', async function () {
    await wait(10 * 1000, 180 * 1000, async () => {
      namespace = await dependencies.namespaceService.findOne(namespace._id);
      return namespace.status?.phase === 'Running';
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

    expect(build).to.exist;
  });

  step('finishes the Build successfully', async function () {
    const phase = await wait(1000, 180 * 1000, async () => {
      build = await dependencies.buildService.findOne(namespace._id, build._id);
      return build.status?.finishedAt ? build.status.phase : null;
    });

    expect(phase).to.eql('Succeeded');
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

    expect(gameServer).to.exist;
  });

  step('runs the Game Server successfully', async function () {
    await wait(10 * 1000, 180 * 1000, async () => {
      gameServer = await dependencies.gameServerService.findOne(namespace._id, gameServer._id);
      return gameServer.status?.endpoints && gameServer.status?.phase === 'Running';
    });
  });

  step('allows connections', async function () {
    const http = gameServer.status.endpoints.tcp.replace('tcp', 'http');
    const url = new URL(http);
    url.hostname = url.hostname === '127.0.0.1' ? 'kubernetes.local.tenlastic.com' : url.hostname;

    const response = await axios({ method: 'get', url: url.href });
    expect(response.data).to.include('Welcome to echo-server!');
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
});
