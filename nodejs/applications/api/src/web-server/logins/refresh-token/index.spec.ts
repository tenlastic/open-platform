import { ContextMock, RequiredFieldError } from '@tenlastic/web-server';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as Chance from 'chance';
import * as jwt from 'jsonwebtoken';
import * as mongoose from 'mongoose';

import { RefreshToken, User } from '../../../mongodb';
import { handler } from '.';

const chance = new Chance();
use(chaiAsPromised);

describe('web-server/logins/refresh-token', function () {
  beforeEach(async function () {
    await User.mock({ password: 'password' });
  });

  context('when a token is not provided', function () {
    it('throws an error', async function () {
      const ctx: any = new ContextMock();

      const promise = handler(ctx);

      return expect(promise).to.be.rejectedWith(
        RequiredFieldError,
        'Missing required field: token.',
      );
    });
  });

  context('when a token is provided', function () {
    context('when the JWT fails verification', function () {
      it('throws an error', async function () {
        const token = jwt.sign({}, chance.hash());
        const ctx: any = new ContextMock({
          request: {
            body: { token },
          },
        });

        const promise = handler(ctx);

        return expect(promise).to.be.rejectedWith('Invalid refresh token.');
      });
    });

    context('when the JWT passes verification', function () {
      context('when the JWT does not include required parameters', function () {
        it('throws an error', async function () {
          const token = jwt.sign({}, process.env.JWT_PRIVATE_KEY.replace(/\\n/g, '\n'), {
            algorithm: 'RS256',
          });
          const ctx: any = new ContextMock({
            request: {
              body: { token },
            },
          });

          const promise = handler(ctx);

          return expect(promise).to.be.rejectedWith('Invalid refresh token.');
        });
      });

      context('when the JWT includes required parameters', function () {
        context('when the RefreshToken is not in the database', function () {
          it('throws an error', async function () {
            const user = await User.mock();
            const token = jwt.sign({ user }, process.env.JWT_PRIVATE_KEY.replace(/\\n/g, '\n'), {
              algorithm: 'RS256',
              jwtid: chance.hash(),
            });
            const ctx: any = new ContextMock({
              request: {
                body: { token },
              },
            });

            const promise = handler(ctx);

            return expect(promise).to.be.rejectedWith('Invalid refresh token.');
          });
        });

        context('when the RefreshToken is in the database', function () {
          context('when the user does not exist', function () {
            it('throws an error', async function () {
              const user = await User.mock();
              const refreshToken = await RefreshToken.mock({
                userId: new mongoose.Types.ObjectId() as any,
              });
              const token = jwt.sign({ user }, process.env.JWT_PRIVATE_KEY.replace(/\\n/g, '\n'), {
                algorithm: 'RS256',
                jwtid: refreshToken._id.toString(),
              });
              const ctx: any = new ContextMock({
                request: {
                  body: { token },
                },
              });

              const promise = handler(ctx);

              return expect(promise).to.be.rejectedWith('Invalid refresh token.');
            });
          });

          context('when the user exists', function () {
            it('returns accessToken and refreshToken', async function () {
              const user = await User.mock();
              const refreshToken = await RefreshToken.mock({ userId: user._id });
              const token = jwt.sign(
                { type: 'refresh', user },
                process.env.JWT_PRIVATE_KEY.replace(/\\n/g, '\n'),
                {
                  algorithm: 'RS256',
                  jwtid: refreshToken._id.toString(),
                },
              );
              const ctx: any = new ContextMock({
                request: {
                  body: { token },
                },
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
});
