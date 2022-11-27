import * as minio from '@tenlastic/minio';
import { AuthorizationRole, BuildFile } from '@tenlastic/mongoose';
import { ContextMock, RecordNotFoundError } from '@tenlastic/web-server';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as fs from 'fs';
import * as unzipper from 'unzipper';

import { MinioBuild } from '../../../../minio';
import {
  Authorization,
  Build,
  BuildDocument,
  Namespace,
  User,
  UserDocument,
} from '../../../../mongodb';
import { handler } from './';

use(chaiAsPromised);

describe('web-server/files/download', function () {
  let user: UserDocument;

  beforeEach(async function () {
    user = await User.mock();
  });

  context('when permission is granted', async function () {
    let ctx: ContextMock;
    let build: BuildDocument;

    beforeEach(async function () {
      const namespace = await Namespace.mock().save();
      await Authorization.mock({
        namespaceId: namespace._id,
        roles: [AuthorizationRole.BuildsRead],
        userId: user._id,
      }).save();

      build = await Build.mock({
        files: [BuildFile.mock({ path: 'index.ts' }), BuildFile.mock({ path: 'index.spec.ts' })],
        namespaceId: namespace._id,
      }).save();

      const firstFileObjectName = MinioBuild.getFileObjectName(build, build.files[0].path);
      const secondFileObjectName = MinioBuild.getFileObjectName(build, build.files[1].path);
      await minio.putObject(
        process.env.MINIO_BUCKET,
        firstFileObjectName,
        fs.createReadStream(__filename),
      );
      await minio.putObject(
        process.env.MINIO_BUCKET,
        secondFileObjectName,
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
      const namespace = await Namespace.mock().save();
      const build = await Build.mock({ namespaceId: namespace._id }).save();

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
