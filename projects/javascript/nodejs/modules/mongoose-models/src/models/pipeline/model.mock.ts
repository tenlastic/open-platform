import * as Chance from 'chance';
import * as mongoose from 'mongoose';

import { Pipeline, PipelineSchema } from './model';
import { PipelineSpecMock } from './spec';

export class PipelineMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static async create(params: Partial<PipelineSchema> = {}) {
    const chance = new Chance();

    const defaults = {
      name: chance.hash(),
      namespaceId: mongoose.Types.ObjectId(),
      spec: PipelineSpecMock.create(),
    };

    return Pipeline.create({ ...defaults, ...params });
  }
}
