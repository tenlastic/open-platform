import * as minio from '@tenlastic/minio';
import { ContextMock } from '@tenlastic/web-server';
import { expect } from 'chai';

import {
  FileDocument,
  FileMock,
  FileSchema,
  ReadonlyGameMock,
  ReadonlyNamespaceMock,
  ReadonlyUserDocument,
  ReadonlyUserMock,
  ReleaseDocument,
  ReleaseMock,
  UserRolesMock,
} from '../../../models';
import { handler } from './';

describe('handlers/files/find', function() {
  let release: ReleaseDocument;
  let record: FileDocument;
  let user: ReadonlyUserDocument;

  beforeEach(async function() {
    user = await ReadonlyUserMock.create();

    const userRoles = UserRolesMock.create({ roles: ['Administrator'], userId: user._id });
    const namespace = await ReadonlyNamespaceMock.create({ accessControlList: [userRoles] });
    const game = await ReadonlyGameMock.create({ namespaceId: namespace._id });
    release = await ReleaseMock.create({ gameId: game._id });
    record = await FileMock.create({ releaseId: release._id });
  });

  it('returns the number of matching records', async function() {
    const ctx = new ContextMock({
      params: { releaseId: release._id },
      state: { user: user.toObject() },
    });

    await handler(ctx as any);

    console.log(ctx.response.body.presignedUrls);
    expect(ctx.response.body.presignedUrls.length).to.eql(1);
    expect(ctx.response.body.records.length).to.eql(1);
    expect(ctx.response.body.records[0]._id.toString()).to.eql(record._id.toString());
  });

  it('returns the md5 hash from minio', async function() {
    await minio.getClient().fPutObject(FileSchema.bucket, record.key, __filename, {});

    const ctx = new ContextMock({
      params: { releaseId: release._id },
      state: { user: user.toObject() },
    });

    await handler(ctx as any);

    expect(ctx.response.body.records[0].md5).to.exist;
  });
});
