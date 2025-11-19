import { ContextMock, RequiredFieldError, UnauthorizedError } from '@tenlastic/web-server';
import { expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { Chance } from 'chance';
import * as sinon from 'sinon';

import { CreateLoginWithSteamContext, dependencies, handler } from '.';

const chance = new Chance();
use(chaiAsPromised);

describe('web-server/logins/steam', function () {
  afterEach(function () {
    sinon.restore();
  });

  context('when parameters are not provided', function () {
    it('throws an error', async function () {
      const ctx = ContextMock<CreateLoginWithSteamContext>();

      const promise = handler(ctx);

      return expect(promise).to.be.rejectedWith(
        RequiredFieldError,
        'Missing required fields: ' +
          'assocHandle, claimedId, identity, responsedNonce, returnTo, sig, and signed.',
      );
    });
  });

  context('when parameters are provided', function () {
    context('when authentication is invalid', function () {
      it('throws an error', async function () {
        const ctx = ContextMock<CreateLoginWithSteamContext>({
          request: {
            body: {
              assocHandle: chance.hash(),
              claimedId: chance.hash(),
              identity: chance.hash(),
              responseNonce: chance.hash(),
              returnTo: chance.hash(),
              sig: chance.hash(),
              signed: chance.hash(),
            },
          },
        });

        sinon.stub(dependencies, 'checkAuthentication').resolves(false);

        const promise = handler(ctx);

        return expect(promise).to.be.rejectedWith(UnauthorizedError);
      });
    });

    context('when authentication is valid', function () {
      context('when the User is not found', function () {
        it('returns accessToken and refreshToken', async function () {
          const ctx = ContextMock<CreateLoginWithSteamContext>({
            request: {
              body: {
                assocHandle: chance.hash(),
                claimedId: chance.hash(),
                identity: chance.hash(),
                responseNonce: chance.hash(),
                returnTo: chance.hash(),
                sig: chance.hash(),
                signed: chance.hash(),
              },
            },
          });

          sinon.stub(dependencies, 'checkAuthentication').resolves(true);

          await handler(ctx);

          expect(ctx.response.body.accessToken).to.exist;
          expect(ctx.response.body.refreshToken).to.exist;
        });
      });

      context('when the User is found', function () {
        it('returns accessToken and refreshToken', async function () {
          const ctx = ContextMock<CreateLoginWithSteamContext>({
            request: {
              body: {
                assocHandle: chance.hash(),
                claimedId: chance.hash(),
                identity: chance.hash(),
                responseNonce: chance.hash(),
                returnTo: chance.hash(),
                sig: chance.hash(),
                signed: chance.hash(),
              },
            },
          });

          sinon.stub(dependencies, 'checkAuthentication').resolves(true);

          await handler(ctx);

          expect(ctx.response.body.accessToken).to.exist;
          expect(ctx.response.body.refreshToken).to.exist;
        });
      });
    });
  });
});
