import {
  buildLogService,
  BuildModel,
  buildService,
  IBuild,
  NamespaceModel,
  namespaceService,
} from '@tenlastic/http';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as Chance from 'chance';
import * as JSZip from 'jszip';

import { wait } from '../wait';

const chance = new Chance();
use(chaiAsPromised);

describe('builds', function() {
  let build: BuildModel;
  let namespace: NamespaceModel;

  beforeEach(async function() {
    namespace = await namespaceService.create({ name: chance.hash() });

    const zip = new JSZip();
    zip.file('Dockerfile', 'FROM n0r1skcom/echo:latest');

    const buffer = await zip.generateAsync({
      compression: 'DEFLATE',
      compressionOptions: { level: 1 },
      type: 'nodebuffer',
    });

    build = await buildService.create(
      {
        entrypoint: 'Dockerfile',
        name: chance.hash(),
        namespaceId: namespace._id,
        platform: IBuild.Platform.Server64,
      },
      buffer,
    );
    expect(build).to.exist;

    const phase = await wait(1000, 180000, async () => {
      const response = await buildService.findOne(build._id);
      return response.status?.finishedAt ? response.status.phase : null;
    });
    expect(phase).to.eql('Succeeded');
  });

  afterEach(async function() {
    await namespaceService.delete(namespace._id);
  });

  it('can be downloaded', async function() {
    const stream = await buildService.download(build._id);

    const result = await new Promise<{ content: string; path: string }>((resolve, reject) => {
      stream
        .on('close', resolve)
        .on('entry', async entry => {
          if (entry.type !== 'File') {
            entry.autodrain();
            return;
          }

          const chunks = [];
          const content = await new Promise<string>((res, rej) => {
            entry.on('data', chunk => chunks.push(Buffer.from(chunk)));
            entry.on('error', err => rej(err));
            entry.on('end', () => res(Buffer.concat(chunks).toString('utf8')));
          });

          return resolve({ content, path: entry.path });
        })
        .on('error', reject);
    });

    expect(result.content).to.eql('FROM n0r1skcom/echo:latest');
    expect(result.path).to.eql('Dockerfile');
  });

  it('generates logs', async function() {
    const logs = await buildLogService.find(build._id, {});
    expect(logs.length).to.be.greaterThan(0);
  });
});
