import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as request from 'request-promise-native';
import * as sinon from 'sinon';

import { setCredentials } from '..';
import { send } from './send';

use(chaiAsPromised);

describe('mailgun', function() {
  let sandbox: sinon.SinonSandbox;

  beforeEach(function() {
    sandbox = sinon.createSandbox();
  });

  afterEach(function() {
    sandbox.restore();
  });

  describe('send()', function() {
    context('when domain and key are not set', function() {
      it('does not send a request to Mailgun', function() {
        const promise = send({
          from: 'from@example.com',
          html: '<p>Hello</p>',
          subject: 'Subject',
          to: 'to@example.com',
        });

        return expect(promise).to.be.rejectedWith('Mailgun credentials not found.');
      });
    });

    context('when domain and key are set', function() {
      it('sends a request to Mailgun', async function() {
        setCredentials('domain', 'key');
        const stub = sandbox.stub(request, 'post');

        await send({
          from: 'from@example.com',
          html: '<p>Hello</p>',
          subject: 'Subject',
          to: 'to@example.com',
        });

        expect(stub.called).to.eql(true);
      });
    });
  });
});
