import { Phase } from '../model';
import { Node, NodeSchema } from './model';

export class NodeMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static create(params: Partial<NodeSchema> = {}) {
    const defaults = { phase: Phase.Running };

    return new Node({ ...defaults, ...params });
  }
}
