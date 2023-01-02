import { EventEmitter } from 'events';

import { client } from './connect';
import { TIMEOUT, TIMEOUT_LIMIT } from './constants';

export async function listenBucketNotification(
  bucketName: string,
  prefix: string,
  suffix: string,
  events: string[],
  timeout = TIMEOUT,
): Promise<EventEmitter> {
  try {
    return client.listenBucketNotification(bucketName, prefix, suffix, events);
  } catch (e) {
    if (e?.code !== 'SlowDown' || timeout > TIMEOUT_LIMIT) {
      throw e;
    }

    await new Promise((res) => setTimeout(res, timeout));
    return listenBucketNotification(bucketName, prefix, suffix, events, timeout * timeout);
  }
}
