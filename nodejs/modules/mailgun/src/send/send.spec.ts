import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as nock from 'nock';

import mailgun from '..';
import { send } from './send';

use(chaiAsPromised);

describe('mailgun', function() {
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
        mailgun.setCredentials('domain', 'key');
        nock('https://api.mailgun.net')
          .post('/v3/domain/messages')
          .reply(200);

        return send({
          from: 'from@example.com',
          html: '<p>Hello</p>',
          subject: 'Subject',
          to: 'to@example.com',
        });
      });
    });
  });
});
