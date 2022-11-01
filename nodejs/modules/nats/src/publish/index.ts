import { TextEncoder } from 'util';

import { getJetStream } from '../connect';

export async function publish(subject: string, message: any) {
  // Encode message to Uint8Array.
  const json = JSON.stringify(message);
  const encoding = new TextEncoder().encode(json);

  const js = getJetStream();
  return js.publish(subject, encoding);
}
