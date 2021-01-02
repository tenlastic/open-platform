import * as Chance from 'chance';
import * as mongoose from 'mongoose';

import { WorkflowLog, WorkflowLogSchema } from './model';

export class WorkflowLogMock {
  /**
   * Creates a record with randomized required parameters if not specified.
   * @param {Object} params The parameters to initialize the record with.
   */
  public static async create(params: Partial<WorkflowLogSchema> = {}) {
    const chance = new Chance();

    const defaults = {
      body: chance.hash(),
      nodeId: chance.hash(),
      unix: Date.now(),
      workflowId: mongoose.Types.ObjectId(),
    };

    return WorkflowLog.create({ ...defaults, ...params });
  }
}
