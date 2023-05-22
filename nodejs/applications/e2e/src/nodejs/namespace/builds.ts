import { NamespaceModel } from '@tenlastic/http';
import wait from '@tenlastic/wait';
import { expect } from 'chai';
import * as fs from 'fs';
import * as unzipper from 'unzipper';

import dependencies from '../../dependencies';
import * as helpers from '../helpers';

describe('/nodejs/namespace/builds', function () {
  let namespace: NamespaceModel;

  afterEach(async function () {
    await helpers.deleteNamespace(namespace?._id);
  });

  it('creates a Namespace and Build', async function () {
    // Create the Namespace.
    namespace = await helpers.createNamespace();

    // Create the Build.
    const dockerfile = fs.readFileSync('./fixtures/Dockerfile', 'utf8');
    const build = await helpers.createBuild(dockerfile, namespace);

    // Download the Build.
    const stream = await dependencies.buildService.download(namespace._id, build._id, {
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
