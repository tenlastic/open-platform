import {
  AuthorizationModel,
  AuthorizationRole,
  NamespaceDocument,
  NamespaceLimitsModel,
  NamespaceModel,
  UserDocument,
  UserModel,
} from '@tenlastic/mongoose';
import { PermissionError } from '@tenlastic/mongoose-permissions';
import { ContextMock, HttpError } from '@tenlastic/web-server';
import { expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { Chance } from 'chance';
import * as sinon from 'sinon';

import { CreateSteamIntegrationContext, dependencies, handler } from '.';

const chance = new Chance();
use(chaiAsPromised);

describe('web-server/steam-integrations/create', function () {
  let user: UserDocument;

  beforeEach(async function () {
    user = await UserModel.mock().save();
  });

  afterEach(function () {
    sinon.restore();
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
      const ctx = ContextMock<CreateSteamIntegrationContext>({
        params: { namespaceId: namespace._id },
        request: { body: { apiKey: chance.hash(), applicationId, name: chance.hash() } },
        state: { user: { _id: user._id.toHexString() } },
      });

      const app = { app_name: chance.hash(), app_type: chance.hash(), appid: applicationId };
      sinon
        .stub(dependencies, 'getPartnerAppListForWebApiKey')
        .resolves({ data: { applist: { apps: { app: [app] } } }, status: 200 });

      await handler(ctx);

      expect(ctx.response.body.record).to.exist;
    });
  });

  context('when apiKey is invalid', function () {
    it('throws an error', async function () {
      const namespace = await NamespaceModel.mock({ limits: NamespaceLimitsModel.mock() }).save();

      const ctx = ContextMock<CreateSteamIntegrationContext>({
        params: { namespaceId: namespace._id },
        request: { body: { apiKey: chance.hash(), applicationId: chance.integer() } },
        state: { user: { _id: user._id.toHexString() } },
      });

      sinon.stub(dependencies, 'getPartnerAppListForWebApiKey').resolves({ status: 403 });

      const promise = handler(ctx);

      return expect(promise).to.be.rejectedWith(
        HttpError,
        'Invalid apiKey. Make sure this is a valid Steam Publisher Web API Key.',
      );
    });
  });

  context('when applicationId is invalid', function () {
    it('throws an error', async function () {
      const namespace = await NamespaceModel.mock({ limits: NamespaceLimitsModel.mock() }).save();

      const ctx = ContextMock<CreateSteamIntegrationContext>({
        params: { namespaceId: namespace._id },
        request: { body: { apiKey: chance.hash(), applicationId: chance.integer() } },
        state: { user: { _id: user._id.toHexString() } },
      });

      const app = { app_name: chance.hash(), app_type: chance.hash(), appid: chance.integer() };
      sinon
        .stub(dependencies, 'getPartnerAppListForWebApiKey')
        .resolves({ data: { applist: { apps: { app: [app] } } }, status: 200 });

      const promise = handler(ctx);

      return expect(promise).to.be.rejectedWith(
        HttpError,
        'Invalid applicationId. ' +
          'Make sure the Steam Publisher Web API Key has ownership of this App ID.',
      );
    });
  });

  context('when permission is denied', function () {
    it('throws an error', async function () {
      const namespace = await NamespaceModel.mock({ limits: NamespaceLimitsModel.mock() }).save();

      const applicationId = chance.integer();
      const ctx = ContextMock<CreateSteamIntegrationContext>({
        params: { namespaceId: namespace._id },
        request: { body: { apiKey: chance.hash(), applicationId } },
        state: { user: { _id: user._id.toHexString() } },
      });

      const app = { app_name: chance.hash(), app_type: chance.hash(), appid: applicationId };
      sinon
        .stub(dependencies, 'getPartnerAppListForWebApiKey')
        .resolves({ data: { applist: { apps: { app: [app] } } }, status: 200 });

      const promise = handler(ctx);

      return expect(promise).to.be.rejectedWith(PermissionError);
    });
  });
});
