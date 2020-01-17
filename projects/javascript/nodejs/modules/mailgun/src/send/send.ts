import * as request from 'request-promise-native';

import { getCredentials } from '../credentials/credentials';

export interface SendOptions {
  from: string;
  html: string;
  subject: string;
  to: string;
}

export async function send(options: SendOptions) {
  const credentials = getCredentials();

  if (!credentials.domain || !credentials.key) {
    throw new Error('Mailgun credentials not found.');
  }

  const url = `https://api:${credentials.key}@api.mailgun.net/v3/${credentials.domain}/messages`;
  return request.post({ form: options, url });
}
