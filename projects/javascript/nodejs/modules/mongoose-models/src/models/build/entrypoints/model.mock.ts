import { BuildEntrypoints, BuildEntrypointsSchema } from './model';

export class BuildEntrypointsMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static create(params: Partial<BuildEntrypointsSchema> = {}) {
    const defaults = {};

    return new BuildEntrypoints({ ...defaults, ...params });
  }
}
