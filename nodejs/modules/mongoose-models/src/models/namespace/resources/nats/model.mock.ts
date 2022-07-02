import { Nats, NatsSchema } from './model';

export class NatsMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static create(params: Partial<NatsSchema> = {}) {
    const defaults = {};

    return new Nats({ ...defaults, ...params });
  }
}
