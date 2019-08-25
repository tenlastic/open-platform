import * as e2e from '@tenlastic/e2e';
import { expect } from 'chai';
import * as Chance from 'chance';
import { google } from 'googleapis';

import { UserModel } from './models';

const chance = new Chance();

const gmail = google.gmail({ version: 'v1' });
const oauth2Client = new google.auth.OAuth2(
  process.env.E2E_GMAIL_CLIENT_ID,
  process.env.E2E_GMAIL_CLIENT_SECRET,
);
oauth2Client.setCredentials({ refresh_token: process.env.E2E_GMAIL_REFRESH_TOKEN });
google.options({ auth: oauth2Client });

describe('logins', function() {
  let email: string;
  let password: string;
  let refreshToken: string;

  beforeEach(async function() {
    email = process.env.E2E_USER_EMAIL;
    password = chance.hash();

    await UserModel.create({ email, password });

    const response = await e2e.request('post', '/logins', { email, password });
    refreshToken = response.body.refreshToken;
  });

  afterEach(async function() {
    await UserModel.deleteAll();
  });

  it('sends a password reset email', async function() {
    const passwordResetResponse = await e2e.request('post', '/password-resets', { email });
    expect(passwordResetResponse.statusCode).to.eql(200);

    const hash = await e2e.wait(2.5 * 1000, 30 * 1000, getPasswordResetHash);
    expect(hash).to.match(/[A-Za-z0-9]+/);
  });

  describe('after a password reset email has been received', function() {
    let hash: string;

    beforeEach(async function() {
      const passwordResetResponse = await e2e.request('post', '/password-resets', { email });
      expect(passwordResetResponse.statusCode).to.eql(200);

      hash = await e2e.wait(2.5 * 1000, 30 * 1000, getPasswordResetHash);
    });

    it('resets the password', async function() {
      const newPassword = chance.hash();
      const passwordResetResponse = await e2e.request('delete', `/password-resets/${hash}`, {
        password: newPassword,
      });
      expect(passwordResetResponse.statusCode).to.eql(200);

      const response = await e2e.request('post', '/logins', { email, password: newPassword });
      expect(response.statusCode).to.eql(200);
    });

    it('invalidates the refresh token', async function() {
      const passwordResetResponse = await e2e.request('delete', `/password-resets/${hash}`, {
        password: chance.hash(),
      });
      expect(passwordResetResponse.statusCode).to.eql(200);

      const response = await e2e.request('post', '/logins/refresh-token', {
        token: refreshToken,
      });

      expect(response.statusCode).to.eql(400);
    });
  });
});

/**
 * Retrieves the hash from the most recently unread Password Reset Request email.
 */
async function getPasswordResetHash() {
  const userId = 'me';
  const res = await gmail.users.messages.list({
    q: 'from:no-reply@tenlastic.com is:unread subject:(Password Reset Request)',
    userId,
  });

  if (!res.data.messages) {
    return null;
  }

  // Retrieve message and mark it as read.
  const { id } = res.data.messages[0];
  const msg = await gmail.users.messages.get({ format: 'full', id, userId });
  await gmail.users.messages.modify({ requestBody: { removeLabelIds: ['UNREAD'] }, id, userId });

  // Decode the base64-encoded body.
  const buffer = Buffer.from(msg.data.payload.body.data, 'base64');
  const body = buffer.toString('utf8');

  const matches = body.match(/\?hash=([A-Za-z0-9]+)/);
  return matches[1];
}
