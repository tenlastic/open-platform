import * as minio from '@tenlastic/minio';
import { ContextMock } from '@tenlastic/web-server';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as fs from 'fs';
import * as unzipper from 'unzipper';

import {
  FileMock,
  NamespaceMock,
  UserDocument,
  UserMock,
  ReleaseDocument,
  ReleaseMock,
  NamespaceRolesMock,
} from '@tenlastic/mongoose-models';
import { handler } from './';

const bucket = process.env.MINIO_BUCKET;
use(chaiAsPromised);

describe('handlers/files/download', function() {
  let user: UserDocument;

  beforeEach(async function() {
    user = await UserMock.create();
  });

  context('when permission is granted', async function() {
    let ctx: ContextMock;
    let release: ReleaseDocument;

    beforeEach(async function() {
      const namespaceRoles = NamespaceRolesMock.create({
        roles: ['Administrator'],
        userId: user._id,
      });
      const namespace = await NamespaceMock.create({ accessControlList: [namespaceRoles] });

      const platform = FileMock.getPlatform();
      release = await ReleaseMock.create({ namespaceId: namespace._id });

      // Set up Release.
      const files = await Promise.all([
        FileMock.create({ path: 'index.ts', platform, releaseId: release._id }),
        FileMock.create({ path: 'index.spec.ts', platform, releaseId: release._id }),
      ]);
      await minio.putObject(bucket, files[0].key, fs.createReadStream(__filename));
      await minio.putObject(bucket, files[1].key, fs.createReadStream(__filename));

      ctx = new ContextMock({
        params: {
          platform,
          releaseId: release._id,
        },
        request: {
          body: {
            include: ['index.ts'],
          },
        },
        state: { user: user.toObject() },
      } as any);
    });

    it('returns a stream with the zipped files', async function() {
      await handler(ctx as any);

      const results = await new Promise<string[]>((resolve, reject) => {
        const entries = [];

        ctx.response.body
          .pipe(unzipper.Parse())
          .on('entry', async entry => {
            const { path, type } = entry;
            if (type === 'Directory') {
              return;
            }

            entries.push(path);
          })
          .on('error', reject)
          .on('finish', () => resolve(entries));
      });

      expect(results.length).to.eql(1);
      expect(results[0]).to.eql('index.ts');
    });
  });

  context('when permission is denied', function() {
    it('throws an error', async function() {
      const namespace = await NamespaceMock.create();
      const release = await ReleaseMock.create({ namespaceId: namespace._id });

      const ctx = new ContextMock({
        params: {
          platform: FileMock.getPlatform(),
          releaseId: release._id,
        },
        request: {
          body: {
            include: ['index.ts'],
          },
        },
        state: { user: user.toObject() },
      } as any);

      const promise = handler(ctx as any);

      return expect(promise).to.be.rejectedWith('Files not found.');
    });
  });
});
