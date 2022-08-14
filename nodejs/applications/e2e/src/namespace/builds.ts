import { BuildModel, IBuild, NamespaceModel } from '@tenlastic/http';
import wait from '@tenlastic/wait';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as Chance from 'chance';
import * as FormData from 'form-data';
import * as JSZip from 'jszip';
import { step } from 'mocha-steps';
import * as unzipper from 'unzipper';

import dependencies from '../dependencies';

const chance = new Chance();
use(chaiAsPromised);

describe('builds', function () {
  let build: BuildModel;
  let namespace: NamespaceModel;

  before(async function () {
    namespace = await dependencies.namespaceService.create({ name: chance.hash() });
  });

  after(async function () {
    await dependencies.namespaceService.delete(namespace._id);
  });

  step('creates a build', async function () {
    // Generate a zip stream.
    const zip = new JSZip();
    zip.file('Dockerfile', 'FROM inanimate/echo-server:latest');
    const buffer = await zip.generateAsync({
      compression: 'DEFLATE',
      compressionOptions: { level: 1 },
      streamFiles: true,
      type: 'nodebuffer',
    });

    // Create the Build.
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

    // Wait for Build to finish.
    const phase = await wait(1000, 180000, async () => {
      build = await dependencies.buildService.findOne(namespace._id, build._id);
      return build.status?.finishedAt ? build.status.phase : null;
    });
    expect(phase).to.eql('Succeeded');
  });

  step('can be downloaded', async function () {
    const response = await dependencies.buildService.download(namespace._id, build._id, {
      responseType: 'stream',
    });

    const result = await new Promise<{ content: string; path: string }>((resolve, reject) => {
      response.data
        .pipe(unzipper.Parse())
        .on('close', resolve)
        .on('entry', async (entry) => {
          if (entry.type !== 'File') {
            entry.autodrain();
            return;
          }

          const chunks = [];
          const content = await new Promise<string>((res, rej) => {
            entry.on('data', (chunk) => chunks.push(Buffer.from(chunk)));
            entry.on('error', (err) => rej(err));
            entry.on('end', () => res(Buffer.concat(chunks).toString('utf8')));
          });

          return resolve({ content, path: entry.path });
        })
        .on('error', reject);
    });

    expect(result.content).to.eql('FROM inanimate/echo-server:latest');
    expect(result.path).to.eql('Dockerfile');
  });

  step('generates logs', async function () {
    const logs = await wait(2.5 * 1000, 10 * 1000, async () => {
      const node = build.status.nodes.find((n) => n.type === 'Pod');
      const response = await dependencies.buildLogService.find(
        namespace._id,
        build._id,
        node._id,
        {},
      );
      return response.length > 0 ? response : null;
    });

    expect(logs.length).to.be.greaterThan(0);
  });
});
