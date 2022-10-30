import { NamespaceStatus, NamespaceStatusSchema } from './model';

export class NamespaceStatusMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static create(params: Partial<NamespaceStatusSchema> = {}) {
    const defaults = {};

    return new NamespaceStatus({ ...defaults, ...params });
  }
}
