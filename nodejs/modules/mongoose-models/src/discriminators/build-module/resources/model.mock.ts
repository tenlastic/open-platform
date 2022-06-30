import { Resources, ResourcesSchema } from './model';

export class ResourcesMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static create(params: Partial<ResourcesSchema> = {}) {
    const defaults = {};

    return new Resources({ ...defaults, ...params });
  }
}
