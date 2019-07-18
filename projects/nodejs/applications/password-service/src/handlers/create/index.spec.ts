import { ContextMock } from '@tenlastic/api-module';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as Chance from 'chance';
import * as mongoose from 'mongoose';

import { handler } from '.';

const chance = new Chance();
use(chaiAsPromised);

describe('handlers/create', function() {
  let user: any;

  beforeEach(async function() {
    user = { _id: new mongoose.Types.ObjectId(), level: 0 };
  });

  context('when plaintext is supplied', function() {
    it('creates a new record', async function() {
      const ctx = new ContextMock({
        request: {
          body: {
            plaintext: chance.hash(),
          },
        },
        state: { user },
      });

      await handler(ctx as any);

      expect(ctx.response.status).to.eql(200);
    });
  });

  context('when plaintext is not supplied', function() {
    it('throws an error', async function() {
      const ctx = new ContextMock({
        request: {
          body: {},
        },
        state: { user },
      });

      const promise = handler(ctx as any);

      return expect(promise).to.be.rejectedWith(
        'The following parameters are required: plaintext.',
      );
    });
  });
});
