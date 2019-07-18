import { ContextMock } from '@tenlastic/api-module';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as Chance from 'chance';
import * as mongoose from 'mongoose';
import * as sinon from 'sinon';

import { PasswordMock, Password } from '../../models';
import * as createHandler from '../create';
import { handler } from '.';

const chance = new Chance();
use(chaiAsPromised);

describe('handlers/update', function() {
  let currentPlaintext: string;
  let sandbox: sinon.SinonSandbox;
  let user: any;

  beforeEach(async function() {
    sandbox = sinon.createSandbox();

    currentPlaintext = chance.hash();
    user = { _id: new mongoose.Types.ObjectId() };

    const hash = await Password.getHashFromPlaintext(currentPlaintext);
    await PasswordMock.create({ hash, userId: user._id });
  });

  afterEach(async function() {
    sandbox.restore();
  });

  context('when currentPlaintext and/or newPlaintext are not supplied', function() {
    it('throws an error', async function() {
      const ctx = new ContextMock({
        request: {
          body: {},
        },
        state: { user },
      });

      const promise = handler(ctx as any);

      expect(promise).to.be.rejectedWith(
        'The following parameters are required: currentPlaintext and newPlaintext.',
      );
    });
  });

  context('when currentPlaintext and newPlaintext are supplied', function() {
    context('when the Password does not exist', function() {
      it('calls the create handler with the newPlaintext value', async function() {
        const newPlaintext = chance.hash();
        const spy = sandbox.stub(createHandler, 'handler');
        const ctx = new ContextMock({
          request: {
            body: { currentPlaintext, newPlaintext },
          },
          state: {
            user: { _id: new mongoose.Types.ObjectId() },
          },
        });

        await handler(ctx as any);

        const call = spy.getCall(0);
        expect(call).to.exist;
        expect(call.args[0].request.body.plaintext).to.eql(newPlaintext);
      });
    });

    context('when the Password exists', function() {
      context('when currentPlaintext is invalid', function() {
        it('throws an error', async function() {
          const ctx = new ContextMock({
            request: {
              body: {
                currentPlaintext: chance.hash(),
                newPlaintext: chance.hash(),
              },
            },
            state: { user },
          });

          const promise = handler(ctx as any);

          expect(promise).to.be.rejectedWith('Invalid currentPlaintext value.');
        });
      });

      context('when currentPlaintext is valid', function() {
        it('updates the Password with the newPlaintext value', async function() {
          const ctx = new ContextMock({
            request: {
              body: {
                currentPlaintext,
                newPlaintext: chance.hash(),
              },
            },
            state: { user },
          });

          await handler(ctx as any);

          expect(ctx.response.status).to.eql(200);
        });
      });
    });
  });
});
