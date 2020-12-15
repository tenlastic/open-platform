import * as Chance from 'chance';

import { PipelineSpecTemplateScript, PipelineSpecTemplateScriptSchema } from './model';

export class PipelineSpecTemplateScriptMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static create(params: Partial<PipelineSpecTemplateScriptSchema> = {}) {
    const chance = new Chance();

    const defaults = {
      image: chance.hash(),
      source: chance.hash(),
    };

    return new PipelineSpecTemplateScript({ ...defaults, ...params });
  }
}
