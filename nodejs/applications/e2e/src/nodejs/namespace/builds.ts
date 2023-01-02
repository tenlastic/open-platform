import { BuildModel, IBuild, NamespaceModel } from '@tenlastic/http';
import wait from '@tenlastic/wait';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as Chance from 'chance';
import * as FormData from 'form-data';
import * as fs from 'fs';
import * as JSZip from 'jszip';
import * as unzipper from 'unzipper';

import dependencies from '../../dependencies';
import { step } from '../../step';

const chance = new Chance();
use(chaiAsPromised);

describe('/nodejs/namespace/builds', function () {
  let build: BuildModel;
  let dockerfile: string;
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
    dockerfile = fs.readFileSync('./fixtures/Dockerfile', 'utf8');

    // Generate a zip stream.
    const zip = new JSZip();
    zip.file('Dockerfile', dockerfile);
    const buffer = await zip.generateAsync({
      compression: 'DEFLATE',
      compressionOptions: { level: 1 },
      type: 'nodebuffer',
    });

    // Create the Build.
    const formData = new FormData();
    formData.append(
      'record',
      JSON.stringify({
        entrypoint: 'Dockerfile',
        name: chance.hash({ length: 64 }),
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

    expect(result.content).to.eql(dockerfile);
    expect(result.path).to.eql('Dockerfile');
  });

  step('generates logs', async function () {
    const logs = await wait(2.5 * 1000, 5 * 1000, async () => {
      const node = build.status.nodes.find((n) => n.type === 'Pod');
      const response = await dependencies.buildLogService.find(
        namespace._id,
        build._id,
        node.pod,
        node.container,
        {},
      );
      return response.length > 0 ? response : null;
    });

    expect(logs.length).to.be.greaterThan(0);
  });
});
