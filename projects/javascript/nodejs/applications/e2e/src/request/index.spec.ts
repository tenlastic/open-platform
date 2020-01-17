import { expect } from 'chai';
import * as requestPromiseNative from 'request-promise-native';
import * as sinon from 'sinon';

import { request } from './';

describe('request()', function() {
  let sandbox: sinon.SinonSandbox;

  beforeEach(function() {
    sandbox = sinon.createSandbox();
  });

  afterEach(function() {
    sandbox.restore();
  });

  context('when issuing a DELETE or GET request', function() {
    context('when parameters are supplied', function() {
      it('appends the parameters to the url as a query string', async function() {
        const stub = sandbox.stub(requestPromiseNative, 'del').resolves();

        await request('http://localhost', 'delete', '/', { key: 'value' });

        const args = stub.getCall(0).args[0];
        expect(args.url).to.contain('{"key":"value"}');
      });
    });

    context('when parameters are not supplied', function() {
      it('does not alter the url', async function() {
        const stub = sandbox.stub(requestPromiseNative, 'get').resolves();

        await request('http://localhost', 'get', '/');

        const args = stub.getCall(0).args[0];
        expect(args.url).to.not.contain('query');
      });
    });
  });

  context('when issuing a POST or PUT request', function() {
    it('includes the user JWT in the authorization header', async function() {
      const stub = sandbox.stub(requestPromiseNative, 'post').resolves();

      await request('http://localhost', 'post', '/', { key: 'value' }, { user: { key: 'value' } });

      const args = stub.getCall(0).args[0];
      expect(args.body).to.eql({ key: 'value' });
      expect(args.headers.authorization).to.exist;
    });
  });
});
