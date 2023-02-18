import { TextEncoder } from 'util';

import { getJetStream } from './jet-stream';

export async function publish(subject: string, message: any) {
  const json = JSON.stringify(message);
  const encoding = new TextEncoder().encode(json);

  const js = getJetStream();
  return js.publish(subject, encoding);
}
