import axios from 'axios';
import * as FormData from 'form-data';

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

  const formData = new FormData();
  for (const [key, value] of Object.entries(options)) {
    formData.append(key, value);
  }
  const url = `https://api:${credentials.key}@api.mailgun.net/v3/${credentials.domain}/messages`;

  return axios({ data: formData, method: 'post', url });
}
