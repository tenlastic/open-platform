import * as nats from 'nats';

import { getJetStream } from '../connect';
import { upsertStream } from '../upsert-stream';

export async function subscribe(durable: string, subject: string) {
  await upsertStream(subject);

  const inbox = nats.createInbox();
  const opts = nats.consumerOpts();
  opts.ackNone();
  opts.deliverNew();
  opts.deliverTo(inbox);
  opts.durable(durable);
  opts.queue(durable);

  const js = getJetStream();
  return js.subscribe(subject, opts);
}
