import { PipelineSpec, PipelineSpecSchema } from './model';

import { PipelineSpecTaskMock } from './task';
import { PipelineSpecTemplateMock } from './template';

export class PipelineSpecMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static create(params: Partial<PipelineSpecSchema> = {}) {
    const defaults = {
      tasks: [PipelineSpecTaskMock.create()],
      templates: [PipelineSpecTemplateMock.create()],
    };

    return new PipelineSpec({ ...defaults, ...params });
  }
}
