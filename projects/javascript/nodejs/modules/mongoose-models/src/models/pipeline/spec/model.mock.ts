import { PipelineSpec, PipelineSpecSchema } from './model';

export class PipelineSpecMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static create(params: Partial<PipelineSpecSchema> = {}) {
    const defaults = {};

    return new PipelineSpec({ ...defaults, ...params });
  }
}
