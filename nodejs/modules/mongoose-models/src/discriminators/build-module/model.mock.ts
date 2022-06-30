import { BuildModule, BuildModuleSchema } from './model';

export class BuildModuleMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static create(params: Partial<BuildModuleSchema> = {}) {
    const defaults = {};

    return new BuildModule({ ...defaults, ...params });
  }
}
