import * as nats from 'nats';

import { getJetStream } from './jet-stream';
import { getJetStreamManager } from './jet-stream-manager';

export async function subscribe(subject: string, options: Partial<nats.ConsumerConfig> = null) {
  const consumerOptions: Partial<nats.ConsumerConfig> = {
    ack_policy: nats.AckPolicy.None,
    deliver_policy: nats.DeliverPolicy.New,
    deliver_subject: nats.createInbox(),
    inactive_threshold: 7 * 24 * 60 * 60 * 1000 * 1000 * 1000,
    ...options,
  };

  if (consumerOptions.ack_policy !== nats.AckPolicy.None) {
    consumerOptions.max_ack_pending = options.max_ack_pending || 10;
  }

  const opts = nats.consumerOpts(consumerOptions);

  if (options?.durable_name) {
    opts.queue(options.durable_name);

    try {
      const jsm = await getJetStreamManager();
      const stream = subject.split('.')[0];
      const consumer = await jsm.consumers.info(stream, options.durable_name);

      for (const [key, value] of Object.entries(consumerOptions)) {
        if (key === 'deliver_subject' || key === 'opt_start_time') {
          continue;
        }

        if (value !== consumer.config[key]) {
          console.log(`Removing previous consumer: ${stream} - ${options.durable_name}.`);
          await jsm.consumers.delete(stream, options.durable_name);
          break;
        }
      }
    } catch {}
  }

  const js = getJetStream();
  return js.subscribe(subject, opts);
}
