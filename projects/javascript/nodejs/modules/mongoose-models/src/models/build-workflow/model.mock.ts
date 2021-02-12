import * as Chance from 'chance';
import * as mongoose from 'mongoose';

import { WorkflowSpecMock } from '../../bases';
import { BuildWorkflow, BuildWorkflowSchema } from './model';

export class BuildWorkflowMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static async create(params: Partial<BuildWorkflowSchema> = {}) {
    const record = await this.new(params);
    return record.save();
  }

  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static async new(params: Partial<BuildWorkflowSchema> = {}) {
    const chance = new Chance();

    const defaults = {
      buildId: mongoose.Types.ObjectId(),
      name: chance.hash(),
      namespaceId: mongoose.Types.ObjectId(),
      spec: WorkflowSpecMock.create(),
    };

    return new BuildWorkflow({ ...defaults, ...params });
  }
}
