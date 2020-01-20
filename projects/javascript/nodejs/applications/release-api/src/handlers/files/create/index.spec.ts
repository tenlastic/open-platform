import { ContextMock } from '@tenlastic/web-server';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as Chance from 'chance';
import * as crypto from 'crypto';
import * as FormData from 'form-data';
import * as fs from 'fs';
import * as JSZip from 'jszip';

import {
  FileMock,
  ReadonlyGameMock,
  ReadonlyNamespaceMock,
  ReadonlyUserDocument,
  ReadonlyUserMock,
  ReleaseMock,
  UserRolesMock,
} from '../../../models';
import { handler } from './';

const chance = new Chance();
use(chaiAsPromised);

describe('handlers/files/create', function() {
  let user: ReadonlyUserDocument;

  beforeEach(async function() {
    user = await ReadonlyUserMock.create();
  });

  context('when permission is granted', function() {
    it('creates a new record', async function() {
      const userRoles = UserRolesMock.create({ roles: ['Administrator'], userId: user._id });
      const namespace = await ReadonlyNamespaceMock.create({ accessControlList: [userRoles] });
      const game = await ReadonlyGameMock.create({ namespaceId: namespace._id });
      const release = await ReleaseMock.create({ gameId: game._id });

      const ctx = new ContextMock({
        params: {
          platform: FileMock.getPlatform(),
          releaseId: release._id,
        },
        request: {
          body: {
            md5: chance.hash(),
            path: chance.hash(),
            url: chance.hash(),
          },
        },
        state: { user },
      } as any);

      await handler(ctx as any);

      expect(ctx.response.body.record).to.exist;
    });
  });

  context('when permission is denied', function() {
    it('throws an error', async function() {
      const namespace = await ReadonlyNamespaceMock.create();
      const game = await ReadonlyGameMock.create({ namespaceId: namespace._id });
      const release = await ReleaseMock.create({ gameId: game._id });

      const ctx = new ContextMock({
        params: {
          releaseId: release._id,
        },
        request: {
          body: {
            md5: chance.hash(),
            path: chance.hash(),
            url: chance.hash(),
          },
        },
        state: { user },
      });

      const promise = handler(ctx as any);

      return expect(promise).to.be.rejected;
    });
  });
});
