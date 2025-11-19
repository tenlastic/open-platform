import * as permissions from '@tenlastic/mongoose-permissions';
import { expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { Chance } from 'chance';
import * as mongoose from 'mongoose';
import * as sinon from 'sinon';

import { ContextMock } from '../../mocks';
import { dependencies, updateOneDate, UpdateOneDateContext } from './';

const chance = new Chance();
use(chaiAsPromised);

const Schema = new mongoose.Schema({ restartedAt: Date });
type Document = mongoose.Document & mongoose.InferSchemaType<typeof Schema>;
const Model = mongoose.model<Document>('handlers/update-one-date', Schema);
const Permissions = {};

describe('handlers/update-one-date', function () {
  afterEach(async function () {
    sinon.restore();
  });

  context('when permission is granted', function () {
    it('returns the record', async function () {
      const ctx = ContextMock<UpdateOneDateContext<Document>>();
      const restartedAt = new Date(Date.now() - 1 * 24 * 60 * 60 * 1000);
      const record = {
        save() {
          return Promise.resolve(this);
        },
        set(k, v) {
          this[k] = v;
          return this;
        },
        restartedAt,
      };

      sinon.stub(dependencies, 'findOne').resolves(record);
      sinon.stub(dependencies, 'getFieldPermissions').resolves(['restartedAt']);
      sinon.stub(dependencies, 'read').resolves(record);

      const handler = updateOneDate('restartedAt', Model, Permissions);
      await handler(ctx);

      expect(ctx.response.body.record.restartedAt).to.exist;
      expect(ctx.response.body.record.restartedAt).to.not.eql(restartedAt);
    });
  });

  context('when permission is denied', function () {
    it('throws an error', async function () {
      const ctx = ContextMock<UpdateOneDateContext<Document>>();
      const name = chance.hash();

      sinon.stub(dependencies, 'findOne').resolves({ name });
      sinon.stub(dependencies, 'getFieldPermissions').resolves([]);

      const handler = updateOneDate('restartedAt', Model, Permissions);
      const promise = handler(ctx);

      return expect(promise).to.be.rejectedWith(permissions.PermissionError);
    });
  });
});
