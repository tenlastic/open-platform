import { NamespaceStatus, NamespaceStatusPhase, NamespaceStatusSchema } from './model';

export class NamespaceStatusMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static create(params: Partial<NamespaceStatusSchema> = {}) {
    const defaults = { phase: NamespaceStatusPhase.Running };

    return new NamespaceStatus({ ...defaults, ...params });
  }
}
