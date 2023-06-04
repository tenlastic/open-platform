import * as nats from 'nats';

import { getConsumer } from './consumers';
import { getJetStream } from './jet-stream';
import { getJetStreamManager } from './jet-stream-manager';

export async function subscribe(subject: string, options?: Partial<nats.ConsumerConfig>) {
  const js = getJetStream();
  const jsm = await getJetStreamManager();
  const stream = subject.split('.')[0];

  const consumerOptions: Partial<nats.ConsumerConfig> = {
    ack_policy: nats.AckPolicy.Explicit,
    deliver_policy: nats.DeliverPolicy.New,
    filter_subject: subject,
    inactive_threshold: 7 * 24 * 60 * 60 * 1000 * 1000 * 1000,
    max_ack_pending: 10,
    max_batch: 100,
    ...options,
  };

  let consumerInfo = await getConsumerInfo(consumerOptions, stream);
  if (!consumerInfo) {
    consumerInfo = await jsm.consumers.add(stream, consumerOptions);
  }

  const consumer = await js.consumers.get(stream, consumerInfo.name);
  return consumer.consume({ max_messages: options.max_batch });
}

async function getConsumerInfo(options: Partial<nats.ConsumerConfig>, stream: string) {
  const jsm = await getJetStreamManager();

  let consumerInfo: nats.ConsumerInfo;
  if (options?.durable_name) {
    consumerInfo = await getConsumer(options.durable_name, stream);

    if (consumerInfo) {
      for (const [key, value] of Object.entries(options)) {
        if (['deliver_policy', 'deliver_subject', 'opt_start_time'].includes(key)) {
          continue;
        }

        if (consumerInfo.config[key] !== value) {
          await jsm.consumers.delete(stream, options.durable_name);
          return null;
        }
      }
    }
  }

  return consumerInfo;
}
