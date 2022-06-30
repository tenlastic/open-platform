import { Module, ModuleSchema } from './model';

export class ModuleMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static create(params: Partial<ModuleSchema> = {}) {
    const defaults = {};

    return new Module({ ...defaults, ...params });
  }
}
