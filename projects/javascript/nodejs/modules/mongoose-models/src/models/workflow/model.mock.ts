import * as Chance from 'chance';
import * as mongoose from 'mongoose';

import { Workflow, WorkflowSchema } from './model';
import { WorkflowSpecMock } from './spec';

export class WorkflowMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static async create(params: Partial<WorkflowSchema> = {}) {
    const record = await this.new(params);
    return record.save();
  }

  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static async new(params: Partial<WorkflowSchema> = {}) {
    const chance = new Chance();

    const defaults = {
      name: chance.hash(),
      namespaceId: mongoose.Types.ObjectId(),
      spec: WorkflowSpecMock.create(),
    };

    return new Workflow({ ...defaults, ...params });
  }
}
