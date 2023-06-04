import wait from '@tenlastic/wait';
import { expect } from 'chai';
import * as Chance from 'chance';
import * as fs from 'fs';
import * as unzipper from 'unzipper';

import dependencies from '../../dependencies';
import * as helpers from '../helpers';

const chance = new Chance();

describe('/nodejs/namespace/builds', function () {
  let namespace: string;

  beforeEach(function () {
    namespace = chance.hash({ length: 32 });
  });

  afterEach(async function () {
    await wait(1 * 1000, 15 * 1000, () => helpers.deleteNamespace(namespace));
  });

  it('creates a Namespace and Build', async function () {
    // Create the Namespace.
    const { _id } = await helpers.createNamespace(namespace);

    // Create the Build.
    const dockerfile = fs.readFileSync('./fixtures/Dockerfile', 'utf8');
    const build = await helpers.createBuild(dockerfile, _id);

    // Download the Build.
    const stream = await dependencies.buildService.download(_id, build._id, {
      responseType: 'stream',
    });
    const result = await new Promise<{ content: string; path: string }>((resolve, reject) => {
      stream.data
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

    // Check for Build Logs.
    const logs = await wait(2.5 * 1000, 5 * 1000, async () => {
      const node = build.status.nodes.find((n) => n.type === 'Pod');
      const response = await dependencies.buildLogService.find(
        _id,
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
