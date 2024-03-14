import {
  AuthorizationModel,
  AuthorizationRole,
  NamespaceModel,
  SteamIntegrationDocument,
  SteamIntegrationModel,
  UserModel,
} from '@tenlastic/mongoose';
import steam from '@tenlastic/steam';
import {
  ContextMock,
  RecordNotFoundError,
  RequiredFieldError,
  UnauthorizedError,
} from '@tenlastic/web-server';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as Chance from 'chance';
import * as sinon from 'sinon';

import { handler } from '.';

const chance = new Chance();
use(chaiAsPromised);

describe('web-server/steam-integrations/logins', function () {
  let sandbox: sinon.SinonSandbox;

  afterEach(function () {
    sandbox.restore();
  });

  beforeEach(async function () {
    sandbox = sinon.createSandbox();
  });

  context('when ticket is not provided', function () {
    it('throws an error', async function () {
      const ctx: any = new ContextMock();

      const promise = handler(ctx);

      return expect(promise).to.be.rejectedWith(
        RequiredFieldError,
        'Missing required field: ticket.',
      );
    });
  });

  context('when ticket is provided', function () {
    context('when the Steam Integration is not found', function () {
      it('throws an error', async function () {
        const ticket = chance.hash();
        const ctx: any = new ContextMock({ request: { body: { ticket } } });

        const promise = handler(ctx);

        return expect(promise).to.be.rejectedWith(RecordNotFoundError);
      });
    });

    context('when the Steam Integration is found', function () {
      let steamIntegration: SteamIntegrationDocument;

      beforeEach(async function () {
        const namespace = await NamespaceModel.mock().save();
        steamIntegration = await SteamIntegrationModel.mock({
          namespaceId: namespace._id,
          roles: [AuthorizationRole.ArticlesReadPublished],
        }).save();
      });

      context('when ticket is invalid', function () {
        it('throws an error', async function () {
          const ticket = chance.hash();
          const ctx: any = new ContextMock({
            params: { _id: steamIntegration._id, namespaceId: steamIntegration.namespaceId },
            request: { body: { ticket } },
          });

          sandbox.stub(steam, 'authenticateUserTicket').resolves({
            data: { response: { error: { errorcode: chance.integer() } } },
            status: 200,
          });

          const promise = handler(ctx);

          return expect(promise).to.be.rejectedWith(UnauthorizedError);
        });
      });

      context('when ticket is valid', function () {
        context('when the User does not own the Application', function () {
          it('throws an error', async function () {
            const ticket = chance.hash();
            const ctx: any = new ContextMock({
              params: { _id: steamIntegration._id, namespaceId: steamIntegration.namespaceId },
              request: { body: { ticket } },
            });

            sandbox.stub(steam, 'authenticateUserTicket').resolves({
              data: { response: { error: { errorcode: chance.integer() } } },
              status: 200,
            });
            sandbox.stub(steam, 'checkAppOwnership').resolves({
              data: { appownership: { ownsapp: false } },
              status: 200,
            });

            const promise = handler(ctx);

            return expect(promise).to.be.rejectedWith(UnauthorizedError);
          });
        });

        context('when the User owns the Application', function () {
          it('upserts the Steam Integration roles', async function () {
            const ticket = chance.hash();
            const user = await UserModel.mock({ steamId: chance.hash() }).save();
            const ctx: any = new ContextMock({
              params: { _id: steamIntegration._id, namespaceId: steamIntegration.namespaceId },
              request: { body: { ticket } },
            });

            sandbox.stub(steam, 'authenticateUserTicket').resolves({
              data: { response: { params: { steamid: user.steamId } } },
              status: 200,
            });
            sandbox.stub(steam, 'checkAppOwnership').resolves({
              data: { appownership: { ownsapp: true } },
              status: 200,
            });

            await handler(ctx);

            const authorization = await AuthorizationModel.findOne({
              namespaceId: steamIntegration.namespaceId,
              userId: user._id,
            });
            expect(authorization).to.exist;
            expect(authorization.roles).to.eql(steamIntegration.roles);
          });

          it('returns accessToken and refreshToken', async function () {
            const ticket = chance.hash();
            const user = await UserModel.mock({ steamId: chance.hash() }).save();
            const ctx: any = new ContextMock({
              params: { _id: steamIntegration._id, namespaceId: steamIntegration.namespaceId },
              request: { body: { ticket } },
            });

            sandbox.stub(steam, 'authenticateUserTicket').resolves({
              data: { response: { params: { steamid: user.steamId } } },
              status: 200,
            });
            sandbox.stub(steam, 'checkAppOwnership').resolves({
              data: { appownership: { ownsapp: true } },
              status: 200,
            });

            await handler(ctx);

            expect(ctx.response.body.accessToken).to.exist;
            expect(ctx.response.body.refreshToken).to.exist;
          });
        });
      });
    });
  });
});
