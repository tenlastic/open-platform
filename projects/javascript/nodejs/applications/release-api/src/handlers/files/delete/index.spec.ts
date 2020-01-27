import { ContextMock } from '@tenlastic/web-server';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as minio from '@tenlastic/minio';

import { MINIO_BUCKET } from '../../../constants';
import {
  FileDocument,
  FileMock,
  ReadonlyGameMock,
  ReadonlyNamespaceMock,
  ReadonlyUserDocument,
  ReadonlyUserMock,
  ReleaseDocument,
  ReleaseMock,
  UserRolesMock,
} from '../../../models';
import { handler } from './';

use(chaiAsPromised);

describe('handlers/files/delete', function() {
  let user: ReadonlyUserDocument;

  beforeEach(async function() {
    user = await ReadonlyUserMock.create();
  });

  context('when permission is granted', function() {
    let release: ReleaseDocument;
    let record: FileDocument;

    beforeEach(async function() {
      const userRoles = UserRolesMock.create({ roles: ['Administrator'], userId: user._id });
      const namespace = await ReadonlyNamespaceMock.create({ accessControlList: [userRoles] });
      const game = await ReadonlyGameMock.create({ namespaceId: namespace._id });
      release = await ReleaseMock.create({ gameId: game._id });
      record = await FileMock.create({ releaseId: release._id });
    });

    it('returns the deleted record', async function() {
      const ctx = new ContextMock({
        params: {
          _id: record._id,
          platform: record.platform,
          releaseId: release._id,
        },
        state: { user: user.toObject() },
      });

      await handler(ctx as any);

      expect(ctx.response.body.record).to.exist;
    });

    it('removes the object from minio', async function() {
      await minio.getClient().fPutObject(MINIO_BUCKET, record.key, __filename, {});

      const ctx = new ContextMock({
        params: {
          _id: record._id,
          platform: record.platform,
          releaseId: release._id,
        },
        state: { user: user.toObject() },
      });

      await handler(ctx as any);

      const promise = minio.getClient().statObject(MINIO_BUCKET, record.key);
      expect(promise).to.be.rejected;
    });
  });

  context('when permission is denied', function() {
    let release: ReleaseDocument;
    let record: FileDocument;

    beforeEach(async function() {
      release = await ReleaseMock.create();
      record = await FileMock.create({ releaseId: release._id });
    });

    it('throws an error', async function() {
      const ctx = new ContextMock({
        params: {
          _id: record._id,
          platform: record.platform,
          releaseId: release._id,
        },
        state: { user: user.toObject() },
      });

      const promise = handler(ctx as any);

      return expect(promise).to.be.rejected;
    });
  });
});
