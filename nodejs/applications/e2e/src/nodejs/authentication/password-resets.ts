import { UserModel } from '@tenlastic/http';
import wait from '@tenlastic/wait';
import { expect, use } from 'chai';
import * as chaiAsPromised from 'chai-as-promised';
import * as Chance from 'chance';
import { google } from 'googleapis';

import dependencies from '../../dependencies';
import { step } from '../../step';

const chance = new Chance();
use(chaiAsPromised);

const gmail = google.gmail({ version: 'v1' });
const oauth2Client = new google.auth.OAuth2(
  process.env.E2E_GMAIL_CLIENT_ID,
  process.env.E2E_GMAIL_CLIENT_SECRET,
);
const userId = 'me';

oauth2Client.setCredentials({ refresh_token: process.env.E2E_GMAIL_REFRESH_TOKEN });
google.options({ auth: oauth2Client });

describe('/nodejs/authentication/password-resets', function () {
  let email: string;
  let hash: string;
  let refreshToken: string;
  let user: UserModel;
  let username: string;

  before(async function () {
    email = process.env.E2E_EMAIL_ADDRESS;
    username = chance.hash({ length: 24 });

    // Delete existing User if exists.
    if (email) {
      const users = await dependencies.userService.find({ where: { email } });
      if (users.length > 0) {
        await dependencies.userService.delete(users[0]._id);
      }
    }

    const password = chance.hash();
    user = await dependencies.userService.create({ email, password, username });

    const response = await dependencies.loginService.createWithCredentials(username, password);
    refreshToken = response.refreshToken;

    // Mark previous messages
    const messages = await getMessages();
    await Promise.all(messages.map((m) => read(m.id)));
  });

  after(async function () {
    await dependencies.userService.delete(user._id);
  });

  step('sends a Password Reset email', async function () {
    await dependencies.passwordResetService.create(email);

    hash = await wait(5 * 1000, 2 * 60 * 1000, () => getPasswordResetHash());
    expect(hash).to.match(/[A-Za-z0-9]+/);
  });

  step('resets the password', async function () {
    const password = chance.hash();
    await dependencies.passwordResetService.delete(hash, password);

    const response = await dependencies.loginService.createWithCredentials(username, password);
    expect(response.accessToken).to.exist;
    expect(response.refreshToken).to.exist;
  });

  step('invalidates the old refresh token', async function () {
    const promise = dependencies.loginService.createWithRefreshToken(refreshToken);
    return expect(promise).to.be.rejected;
  });
});

async function getMessage() {
  const messages = await getMessages();
  if (messages.length === 0) {
    return null;
  }

  // Read the first message.
  const message = await gmail.users.messages.get({ format: 'full', id: messages[0].id, userId });
  await read(message.data.id);

  // Decode the base64-encoded body.
  return Buffer.from(message.data.payload.body.data, 'base64').toString('utf8');
}

async function getMessages() {
  const query = ['from:no-reply@tenlastic.com', 'is:unread', 'subject:(Password Reset Request)'];
  const response = await gmail.users.messages.list({ q: query.join(' '), userId });

  return response.data.messages ?? [];
}

/**
 * Retrieves the hash from the most recently unread Password Reset Request email.
 */
async function getPasswordResetHash() {
  const body = await getMessage();
  if (!body) {
    return null;
  }

  const matches = body.match(/reset-password\/([A-Za-z0-9]+)/);
  return matches[1];
}

function read(id: string) {
  return gmail.users.messages.modify({ id, requestBody: { removeLabelIds: ['UNREAD'] }, userId });
}
