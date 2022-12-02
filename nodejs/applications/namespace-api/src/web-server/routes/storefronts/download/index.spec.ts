import * as minio from '@tenlastic/minio';
import {
  AuthorizationModel,
  AuthorizationRole,
  NamespaceModel,
  StorefrontModel,
  UserModel,
} from '@tenlastic/mongoose';
import { ContextMock } from '@tenlastic/web-server';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as fs from 'fs';

import { MinioStorefront } from '../../../../minio';
import { handler } from './';

use(chaiAsPromised);

describe('web-server/storefronts/download', function () {
  it('returns a stream with the requested file', async function () {
    const user = await UserModel.mock().save();
    const namespace = await NamespaceModel.mock().save();
    await AuthorizationModel.mock({
      namespaceId: namespace._id,
      roles: [AuthorizationRole.StorefrontsRead],
      userId: user._id,
    }).save();
    const storefront = await StorefrontModel.mock({ namespaceId: namespace._id }).save();

    // Upload test file to Minio.
    await minio.putObject(
      process.env.MINIO_BUCKET,
      MinioStorefront.getObjectName(storefront.namespaceId, storefront._id, 'background'),
      fs.createReadStream(__filename),
    );

    const ctx = new ContextMock({
      params: {
        field: 'background',
        namespaceId: storefront.namespaceId,
        storefrontId: storefront._id,
      },
      state: { user },
    } as any);

    await handler(ctx as any);

    expect(ctx.response.body).to.exist;
  });
});
