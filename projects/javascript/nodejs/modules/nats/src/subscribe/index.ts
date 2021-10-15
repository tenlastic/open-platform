import * as nats from 'nats';

import { getJetStream } from '../connect';

export async function subscribe(durable: string, subject: string) {
  const inbox = nats.createInbox();

  const opts = nats.consumerOpts();
  opts.ackNone();
  opts.deliverNew();
  opts.deliverTo(inbox);
  opts.durable(durable);

  const js = getJetStream();
  return js.subscribe(subject, opts);
}
