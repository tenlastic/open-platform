import { podApiV1 } from '@tenlastic/kubernetes';
import { PermissionError } from '@tenlastic/mongoose-permissions';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as Chance from 'chance';
import * as sinon from 'sinon';

import { ContextMock } from '../../context';
import { RecordNotFoundError } from '../../errors';
import { findLogs } from './';

const chance = new Chance();
use(chaiAsPromised);

describe('handlers/logs', function () {
  let sandbox: sinon.SinonSandbox;

  beforeEach(async function () {
    sandbox = sinon.createSandbox();
  });

  afterEach(function () {
    sandbox.restore();
  });

  context('when permission is granted', function () {
    it('returns log records', async function () {
      sandbox
        .stub(podApiV1, 'readNamespacedPodLog')
        .resolves([{ body: chance.hash(), unix: chance.floating() }]);

      const ctx = new ContextMock({
        params: { _id: chance.hash(), container: chance.hash(), pod: chance.hash() },
      });
      const Permissions = {
        findOne: () =>
          Promise.resolve({
            status: { nodes: [{ container: ctx.params.container, pod: ctx.params.pod }] },
          }),
        getFieldPermissions: () => Promise.resolve(['logs']),
      };

      const handler = findLogs(Permissions as any);
      await handler(ctx as any);

      expect(ctx.response.body.records).to.exist;
      expect(ctx.response.body.records.length).to.eql(1);
    });

    it('throws an error', async function () {
      const ctx = new ContextMock({
        params: { _id: chance.hash(), container: chance.hash(), pod: chance.hash() },
      });
      const Permissions = {
        findOne: () =>
          Promise.resolve({
            status: { nodes: [{ container: chance.hash(), pod: chance.hash() }] },
          }),
      };

      const handler = findLogs(Permissions as any);
      const promise = handler(ctx as any);

      return expect(promise).to.be.rejectedWith(RecordNotFoundError);
    });
  });

  context('when permission is denied', function () {
    it('throws an error', async function () {
      const ctx = new ContextMock({
        params: { _id: chance.hash(), container: chance.hash(), pod: chance.hash() },
      });
      const Permissions = {
        findOne: () =>
          Promise.resolve({
            status: { nodes: [{ container: ctx.params.container, pod: ctx.params.pod }] },
          }),
        getFieldPermissions: () => Promise.resolve(['']),
      };

      const handler = findLogs(Permissions as any);
      const promise = handler(ctx as any);

      return expect(promise).to.be.rejectedWith(PermissionError);
    });
  });
});
