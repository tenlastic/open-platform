import * as Chance from 'chance';
import * as mongoose from 'mongoose';

import { PipelineTemplate, PipelineTemplateSchema } from './model';

export class PipelineTemplateMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static async create(params: Partial<PipelineTemplateSchema> = {}) {
    const chance = new Chance();

    const defaults = {
      namespaceId: mongoose.Types.ObjectId(),
      pipelineTemplate: {},
    };

    return PipelineTemplate.create({ ...defaults, ...params });
  }
}
