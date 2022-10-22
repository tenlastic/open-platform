import { NamespaceStatusComponentName, NamespaceStatusPhase } from '../model';
import { NamespaceStatusNode, NamespaceStatusNodeSchema } from './model';

export class NamespaceStatusNodeMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static create(params: Partial<NamespaceStatusNodeSchema> = {}) {
    const defaults = {
      component: NamespaceStatusComponentName.Api,
      phase: NamespaceStatusPhase.Running,
    };

    return new NamespaceStatusNode({ ...defaults, ...params });
  }
}
