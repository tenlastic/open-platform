import {
  AuthorizationModel,
  AuthorizationRole,
  NamespaceDocument,
  NamespaceModel,
  NamespaceLimitsModel,
  UserDocument,
  UserModel,
} from '@tenlastic/mongoose';
import { PermissionError } from '@tenlastic/mongoose-permissions';
import steam from '@tenlastic/steam';
import { ContextMock, HttpError } from '@tenlastic/web-server';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import { Chance } from 'chance';
import * as sinon from 'sinon';

import { handler } from '.';

const chance = new Chance();
use(chaiAsPromised);

describe('web-server/steam-integrations/create', function () {
  let sandbox: sinon.SinonSandbox;
  let user: UserDocument;

  beforeEach(async function () {
    sandbox = sinon.createSandbox();

    user = await UserModel.mock().save();
  });

  afterEach(function () {
    sandbox.restore();
  });

  context('when permission is granted', function () {
    let namespace: NamespaceDocument;

    beforeEach(async function () {
      namespace = await NamespaceModel.mock().save();
      await AuthorizationModel.mock({
        namespaceId: namespace._id,
        roles: [AuthorizationRole.SteamIntegrationsRead, AuthorizationRole.SteamIntegrationsWrite],
        userId: user._id,
      }).save();
    });

    it('creates a Steam API Key', async function () {
      const applicationId = chance.integer();
      const ctx = new ContextMock({
        params: { namespaceId: namespace._id },
        request: { body: { apiKey: chance.hash(), applicationId, name: chance.hash() } },
        state: { user },
      } as any);

      const app = { app_name: chance.hash(), app_type: chance.hash(), appid: applicationId };
      sandbox
        .stub(steam, 'getPartnerAppListForWebApiKey')
        .resolves({ data: { applist: { apps: { app: [app] } } }, status: 200 });

      await handler(ctx as any);

      expect(ctx.response.body.record).to.exist;
    });
  });

  context('when apiKey is invalid', function () {
    it('throws an error', async function () {
      const namespace = await NamespaceModel.mock({ limits: NamespaceLimitsModel.mock() }).save();

      const ctx = new ContextMock({
        params: { namespaceId: namespace._id },
        request: { body: { apiKey: chance.hash(), applicationId: chance.integer() } },
        state: { user },
      } as any);

      sandbox.stub(steam, 'getPartnerAppListForWebApiKey').resolves({ status: 403 });

      const promise = handler(ctx as any);

      return expect(promise).to.be.rejectedWith(
        HttpError,
        'Invalid apiKey. Make sure this is a valid Steam Publisher Web API Key.',
      );
    });
  });

  context('when applicationId is invalid', function () {
    it('throws an error', async function () {
      const namespace = await NamespaceModel.mock({ limits: NamespaceLimitsModel.mock() }).save();

      const ctx = new ContextMock({
        params: { namespaceId: namespace._id },
        request: { body: { apiKey: chance.hash(), applicationId: chance.integer() } },
        state: { user },
      } as any);

      const app = { app_name: chance.hash(), app_type: chance.hash(), appid: chance.integer() };
      sandbox
        .stub(steam, 'getPartnerAppListForWebApiKey')
        .resolves({ data: { applist: { apps: { app: [app] } } }, status: 200 });

      const promise = handler(ctx as any);

      return expect(promise).to.be.rejectedWith(
        HttpError,
        'Invalid applicationId. Make sure the Steam Publisher Web API Key has ownership of this App ID.',
      );
    });
  });

  context('when permission is denied', function () {
    it('throws an error', async function () {
      const namespace = await NamespaceModel.mock({ limits: NamespaceLimitsModel.mock() }).save();

      const applicationId = chance.integer();
      const ctx = new ContextMock({
        params: { namespaceId: namespace._id },
        request: { body: { apiKey: chance.hash(), applicationId } },
        state: { user },
      } as any);

      const app = { app_name: chance.hash(), app_type: chance.hash(), appid: applicationId };
      sandbox
        .stub(steam, 'getPartnerAppListForWebApiKey')
        .resolves({ data: { applist: { apps: { app: [app] } } }, status: 200 });

      const promise = handler(ctx as any);

      return expect(promise).to.be.rejectedWith(PermissionError);
    });
  });
});
