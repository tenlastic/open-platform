import * as minio from '@tenlastic/minio';
import {
  AuthorizationMock,
  AuthorizationRole,
  NamespaceMock,
  StorefrontMock,
  UserMock,
} from '../../../mongodb';
import { ContextMock } from '@tenlastic/web-server';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as fs from 'fs';

import { handler } from './';

use(chaiAsPromised);

describe('handlers/storefronts/download', function () {
  it('returns a stream with the requested file', async function () {
    const user = await UserMock.create();
    const namespace = await NamespaceMock.create();
    await AuthorizationMock.create({
      namespaceId: namespace._id,
      roles: [AuthorizationRole.StorefrontsRead],
      userId: user._id,
    });
    const storefront = await StorefrontMock.create({ namespaceId: namespace._id });

    // Upload test file to Minio.
    await minio.putObject(
      process.env.MINIO_BUCKET,
      storefront.getMinioKey('background'),
      fs.createReadStream(__filename),
    );

    const ctx = new ContextMock({
      params: { field: 'background', storefrontId: storefront._id },
      state: { user },
    } as any);

    await handler(ctx as any);

    expect(ctx.response.body).to.exist;
  });
});
