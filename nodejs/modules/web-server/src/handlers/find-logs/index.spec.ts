import { podApiV1 } from '@tenlastic/kubernetes';
import * as permissions from '@tenlastic/mongoose-permissions';
import { expect, use } from 'chai';
import chaiAsPromised from 'chai-as-promised';
import { Chance } from 'chance';
import * as mongoose from 'mongoose';
import * as sinon from 'sinon';

import { RecordNotFoundError } from '../../errors';
import { ContextMock } from '../../mocks';
import { dependencies, findLogs, FindLogsContext } from './';

const chance = new Chance();
use(chaiAsPromised);

const Schema = new mongoose.Schema({
  status: {
    type: new mongoose.Schema({
      nodes: [new mongoose.Schema({ container: String, pod: String })],
    }),
  },
});
type Document = mongoose.Document & mongoose.InferSchemaType<typeof Schema>;
const Model = mongoose.model<Document>('handlers/find-logs', Schema);
const Permissions = {};

describe('handlers/find-logs', function () {
  afterEach(async function () {
    sinon.restore();
  });

  context('when permission is granted', function () {
    it('returns the record', async function () {
      const ctx = ContextMock<FindLogsContext>({
        params: { _id: chance.hash(), container: chance.hash(), pod: chance.hash() },
      });

      sinon.stub(dependencies, 'findOne').resolves({
        status: { nodes: [{ container: ctx.params.container, pod: ctx.params.pod }] },
      });
      sinon.stub(dependencies, 'getFieldPermissions').resolves(['logs']);
      sinon
        .stub(podApiV1, 'readNamespacedPodLog')
        .resolves([{ body: chance.hash(), unix: chance.floating() }]);

      const handler = findLogs(Model, Permissions);
      await handler(ctx);

      expect(ctx.response.body.records).to.exist;
      expect(ctx.response.body.records.length).to.eql(1);
    });

    it('throws an error', async function () {
      const ctx = ContextMock<FindLogsContext>({
        params: { _id: chance.hash(), container: chance.hash(), pod: chance.hash() },
      });

      sinon.stub(dependencies, 'findOne').resolves({
        status: { nodes: [{ container: chance.hash(), pod: chance.hash() }] },
      });

      const handler = findLogs(Model, Permissions);
      const promise = handler(ctx);

      return expect(promise).to.be.rejectedWith(RecordNotFoundError);
    });
  });

  context('when permission is denied', function () {
    it('throws an error', async function () {
      const ctx = ContextMock<FindLogsContext>({
        params: { _id: chance.hash(), container: chance.hash(), pod: chance.hash() },
      });

      sinon.stub(dependencies, 'findOne').resolves({
        status: { nodes: [{ container: ctx.params.container, pod: ctx.params.pod }] },
      });
      sinon.stub(dependencies, 'getFieldPermissions').resolves([]);

      const handler = findLogs(Model, Permissions);
      const promise = handler(ctx);

      return expect(promise).to.be.rejectedWith(permissions.PermissionError);
    });
  });
});
