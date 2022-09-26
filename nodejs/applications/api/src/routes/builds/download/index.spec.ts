import * as minio from '@tenlastic/minio';
import {
  AuthorizationMock,
  AuthorizationRole,
  BuildDocument,
  BuildFileMock,
  BuildMock,
  NamespaceMock,
  UserDocument,
  UserMock,
} from '../../../mongodb';
import { ContextMock, RecordNotFoundError } from '@tenlastic/web-server';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as fs from 'fs';
import * as unzipper from 'unzipper';

import { handler } from './';

use(chaiAsPromised);

describe('handlers/files/download', function () {
  let user: UserDocument;

  beforeEach(async function () {
    user = await UserMock.create();
  });

  context('when permission is granted', async function () {
    let ctx: ContextMock;
    let build: BuildDocument;

    beforeEach(async function () {
      const namespace = await NamespaceMock.create();
      await AuthorizationMock.create({
        namespaceId: namespace._id,
        roles: [AuthorizationRole.BuildsRead],
        userId: user._id,
      });

      build = await BuildMock.create({
        files: [
          BuildFileMock.create({ path: 'index.ts' }),
          BuildFileMock.create({ path: 'index.spec.ts' }),
        ],
        namespaceId: namespace._id,
      });

      const firstFileMinioKey = build.getFilePath(build.files[0].path);
      const secondFileMinioKey = build.getFilePath(build.files[1].path);
      await minio.putObject(
        process.env.MINIO_BUCKET,
        firstFileMinioKey,
        fs.createReadStream(__filename),
      );
      await minio.putObject(
        process.env.MINIO_BUCKET,
        secondFileMinioKey,
        fs.createReadStream(__filename),
      );

      ctx = new ContextMock({
        params: {
          _id: build._id,
        },
        request: {
          query: {
            files: '10',
          },
        },
        state: { user },
      } as any);
    });

    it('returns a stream with the zipped files', async function () {
      await handler(ctx as any);

      const results = await new Promise<string[]>((resolve, reject) => {
        const entries = [];

        ctx.response.body
          .pipe(unzipper.Parse())
          .on('entry', async (entry) => {
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

  context('when permission is denied', function () {
    it('throws an error', async function () {
      const namespace = await NamespaceMock.create();
      const build = await BuildMock.create({ namespaceId: namespace._id });

      const ctx = new ContextMock({
        params: {
          _id: build._id,
        },
        request: {
          query: {
            files: '10',
          },
        },
        state: { user },
      } as any);

      const promise = handler(ctx as any);

      return expect(promise).to.be.rejectedWith(RecordNotFoundError);
    });
  });
});
