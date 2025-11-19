import * as permissions from '@tenlastic/mongoose-permissions';
import { expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { Chance } from 'chance';
import * as mongoose from 'mongoose';
import * as sinon from 'sinon';

import { ContextMock } from '../../mocks';
import { deleteOne, DeleteOneContext, dependencies } from './';

const chance = new Chance();
use(chaiAsPromised);

const Schema = new mongoose.Schema({ name: String });
type Document = mongoose.Document & mongoose.InferSchemaType<typeof Schema>;
const Model = mongoose.model<Document>('handlers/delete-one', Schema);
const Permissions = {};

describe('handlers/delete-one', function () {
  afterEach(async function () {
    sinon.restore();
  });

  context('when permission is granted', function () {
    it('returns the record', async function () {
      const ctx = ContextMock<DeleteOneContext<Document>>();
      const name = chance.hash();

      sinon.stub(dependencies, 'deleteOne').resolves({ name });
      sinon.stub(dependencies, 'findOne').resolves({ name });
      sinon.stub(dependencies, 'read').resolves({ name });

      const handler = deleteOne(Model, Permissions);
      await handler(ctx);

      expect(ctx.response.body.record).to.eql({ name });
    });
  });

  context('when permission is denied', function () {
    it('throws an error', async function () {
      const ctx = ContextMock<DeleteOneContext<Document>>();
      const name = chance.hash();

      sinon.stub(dependencies, 'deleteOne').rejects(new permissions.PermissionError());
      sinon.stub(dependencies, 'findOne').resolves({ name });

      const handler = deleteOne(Model, Permissions);
      const promise = handler(ctx);

      return expect(promise).to.be.rejectedWith(permissions.PermissionError);
    });
  });
});
