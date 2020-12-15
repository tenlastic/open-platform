import * as Chance from 'chance';

import { PipelineSpecTemplate, PipelineSpecTemplateSchema } from './model';
import { PipelineSpecTemplateScriptMock } from './script';

export class PipelineSpecTemplateMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static create(params: Partial<PipelineSpecTemplateSchema> = {}) {
    const chance = new Chance();

    const defaults = {
      name: chance.hash(),
      script: PipelineSpecTemplateScriptMock.create(),
    };

    return new PipelineSpecTemplate({ ...defaults, ...params });
  }
}
