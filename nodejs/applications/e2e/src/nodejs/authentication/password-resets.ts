import { UserModel } from '@tenlastic/http';
import wait from '@tenlastic/wait';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as Chance from 'chance';
import { google } from 'googleapis';

import dependencies from '../../dependencies';

const chance = new Chance();
use(chaiAsPromised);

const gmail = google.gmail({ version: 'v1' });
const oauth2Client = new google.auth.OAuth2(
  process.env.E2E_GMAIL_CLIENT_ID,
  process.env.E2E_GMAIL_CLIENT_SECRET,
);
oauth2Client.setCredentials({ refresh_token: process.env.E2E_GMAIL_REFRESH_TOKEN });
google.options({ auth: oauth2Client });

describe('/nodejs/authentication/password-resets', function () {
  let email: string;
  let refreshToken: string;
  let user: UserModel;
  let username: string;

  beforeEach(async function () {
    email = process.env.E2E_EMAIL_ADDRESS;
    username = chance.hash({ length: 20 });

    const password = chance.hash();

    // Delete existing User if exists;
    const users = await dependencies.userService.find({ where: { email } });
    if (users.length > 0) {
      await dependencies.userService.delete(users[0]._id);
    }

    user = await dependencies.userService.create({ email, password, username });

    const response = await dependencies.loginService.createWithCredentials(username, password);
    refreshToken = response.refreshToken;
  });

  afterEach(async function () {
    await dependencies.userService.delete(user._id);
  });

  it('sends a Password Reset email', async function () {
    await dependencies.passwordResetService.create(email);

    const hash = await wait(2.5 * 1000, 30 * 1000, getPasswordResetHash);
    expect(hash).to.match(/[A-Za-z0-9]+/);
  });

  describe('after a Password Reset email has been received', function () {
    let hash: string;

    beforeEach(async function () {
      await dependencies.passwordResetService.create(email);
      hash = await wait(2.5 * 1000, 30 * 1000, getPasswordResetHash);
    });

    it('resets the password', async function () {
      const password = chance.hash();
      await dependencies.passwordResetService.delete(hash, password);

      const response = await dependencies.loginService.createWithCredentials(username, password);
      expect(response.accessToken).to.exist;
      expect(response.refreshToken).to.exist;
    });

    it('invalidates the old refresh token', async function () {
      await dependencies.passwordResetService.delete(hash, chance.hash());

      const promise = dependencies.loginService.createWithRefreshToken(refreshToken);
      return expect(promise).to.be.rejected;
    });
  });
});

async function getMessage(query: string) {
  const userId = 'me';
  const res = await gmail.users.messages.list({ q: query, userId });

  if (!res.data.messages) {
    return null;
  }

  // Retrieve message and mark it as read.
  const { id } = res.data.messages[0];
  const msg = await gmail.users.messages.get({ format: 'full', id, userId });
  await gmail.users.messages.modify({ id, requestBody: { removeLabelIds: ['UNREAD'] }, userId });

  // Decode the base64-encoded body.
  const buffer = Buffer.from(msg.data.payload.body.data, 'base64');
  return buffer.toString('utf8');
}

/**
 * Retrieves the hash from the most recently unread Password Reset Request email.
 */
async function getPasswordResetHash() {
  const body = await getMessage(
    'from:no-reply@tenlastic.com is:unread subject:(Password Reset Request)',
  );

  if (!body) {
    return null;
  }

  const matches = body.match(/reset-password\/([A-Za-z0-9]+)/);
  return matches[1];
}