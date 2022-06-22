import * as nats from 'nats';

import { getJetStream, getJetStreamManager } from '../connect';
import { upsertStream } from '../upsert-stream';

export async function subscribe(
  durable: string,
  subject: string,
  options: Partial<nats.ConsumerConfig> = null,
) {
  await upsertStream(subject);

  const consumerOptions: Partial<nats.ConsumerConfig> = {
    ack_policy: nats.AckPolicy.None,
    deliver_policy: nats.DeliverPolicy.New,
    deliver_subject: nats.createInbox(),
    durable_name: durable,
    ...options,
  };

  if (consumerOptions.ack_policy !== nats.AckPolicy.None) {
    consumerOptions.max_ack_pending = options.max_ack_pending || 10;
  }

  const opts = nats.consumerOpts(consumerOptions);
  opts.queue(durable);

  try {
    const jsm = await getJetStreamManager();
    const stream = subject.split('.')[0];
    const consumer = await jsm.consumers.info(stream, durable);

    for (const [key, value] of Object.entries(consumerOptions)) {
      if (key === 'deliver_subject') {
        continue;
      }

      if (value !== consumer.config[key]) {
        console.log(`Removing previous consumer: ${stream} - ${durable}.`);
        await jsm.consumers.delete(stream, durable);
        break;
      }
    }
  } catch {}

  const js = getJetStream();
  return js.subscribe(subject, opts);
}